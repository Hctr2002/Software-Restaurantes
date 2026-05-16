


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."OrderStatus" AS ENUM (
    'PENDING',
    'VALIDATED',
    'PREPARING',
    'READY',
    'DELIVERED',
    'REJECTED',
    'COMPLETED',
    'PARCIAL'
);


ALTER TYPE "public"."OrderStatus" OWNER TO "postgres";


CREATE TYPE "public"."Role" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'GARZON',
    'COCINA',
    'CLIENTE',
    'CAJERO',
    'BAR'
);


ALTER TYPE "public"."Role" OWNER TO "postgres";


CREATE TYPE "public"."StationType" AS ENUM (
    'KITCHEN',
    'BAR'
);


ALTER TYPE "public"."StationType" OWNER TO "postgres";


CREATE TYPE "public"."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'CANCELLED'
);


ALTER TYPE "public"."SubscriptionStatus" OWNER TO "postgres";


CREATE TYPE "public"."TableStatus" AS ENUM (
    'FREE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING'
);


ALTER TYPE "public"."TableStatus" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Actualizar a COMPLETED todas las órdenes del array
    -- que aún no estén en un estado terminal.
    UPDATE orders
    SET status = 'COMPLETED'
    WHERE id = ANY(p_order_ids)
      AND status NOT IN ('COMPLETED', 'REJECTED');

    -- Actualizar a CLEANING todas las mesas involucradas.
    -- Buscamos las mesas directas de las órdenes y también las mesas
    -- que compartan la misma sesión (en caso de fusión).
    UPDATE tables
    SET
        status         = 'CLEANING',
        bill_requested = false
    WHERE id IN (
        SELECT DISTINCT table_id 
        FROM orders 
        WHERE id = ANY(p_order_ids) AND table_id IS NOT NULL
    ) OR current_session_id IN (
        SELECT DISTINCT session_id 
        FROM orders 
        WHERE id = ANY(p_order_ids) AND session_id IS NOT NULL
    ) OR id = p_table_id;
END;
$$;


ALTER FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_restaurant_id"() RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->'app_metadata'->>'restaurant_id', '')::text;
$$;


ALTER FUNCTION "public"."get_auth_restaurant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
$$;


ALTER FUNCTION "public"."get_auth_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_active_theme"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.is_active THEN
        UPDATE public.restaurant_themes 
        SET is_active = false 
        WHERE restaurant_id = NEW.restaurant_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_active_theme"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (id, email, role, restaurant_id)
  VALUES (
    new.id,
    new.email,
    COALESCE((new.raw_app_meta_data->>'role')::public."Role", 'CLIENTE'),
    (new.raw_app_meta_data->>'restaurant_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    restaurant_id = EXCLUDED.restaurant_id;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_auth_user_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_order_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    CASE OLD.status
        WHEN 'PENDING' THEN
            IF NEW.status NOT IN ('VALIDATED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PENDING -> %', NEW.status;
            END IF;
        WHEN 'VALIDATED' THEN
            IF NEW.status NOT IN ('PREPARING', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status NOT IN ('READY', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PREPARING -> %', NEW.status;
            END IF;
        WHEN 'READY' THEN
            IF NEW.status NOT IN ('DELIVERED', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: READY -> %', NEW.status;
            END IF;
        WHEN 'DELIVERED' THEN
            IF NEW.status != 'COMPLETED' THEN
                RAISE EXCEPTION 'Transición inválida: DELIVERED -> %', NEW.status;
            END IF;
        WHEN 'COMPLETED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya COMPLETED';
        WHEN 'REJECTED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya REJECTED';
    END CASE;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_order_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_order_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Customers create PENDING orders; waiters create VALIDATED orders directly
        IF NEW.status NOT IN ('PENDING', 'VALIDATED') THEN
            RAISE EXCEPTION 'Un pedido nuevo debe comenzar en PENDING o VALIDATED';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    CASE OLD.status
        WHEN 'PENDING' THEN
            IF NEW.status NOT IN ('VALIDATED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: PENDING -> %', NEW.status;
            END IF;
        WHEN 'VALIDATED' THEN
            IF NEW.status NOT IN ('PREPARING', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: VALIDATED -> %', NEW.status;
            END IF;
        WHEN 'PREPARING' THEN
            IF NEW.status NOT IN ('READY', 'PARCIAL') THEN
                RAISE EXCEPTION 'Transición inválida: PREPARING -> %', NEW.status;
            END IF;
        WHEN 'PARCIAL' THEN
            IF NEW.status NOT IN ('READY', 'DELIVERED') THEN
                RAISE EXCEPTION 'Transición inválida: PARCIAL -> %', NEW.status;
            END IF;
        WHEN 'READY' THEN
            IF NEW.status NOT IN ('DELIVERED', 'COMPLETED', 'REJECTED') THEN
                RAISE EXCEPTION 'Transición inválida: READY -> %', NEW.status;
            END IF;
        WHEN 'DELIVERED' THEN
            IF NEW.status != 'COMPLETED' THEN
                RAISE EXCEPTION 'Transición inválida: DELIVERED -> %', NEW.status;
            END IF;
        WHEN 'COMPLETED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya COMPLETED';
        WHEN 'REJECTED' THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de un pedido ya REJECTED';
    END CASE;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_order_transition"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "user_id" "text",
    "user_email" "text",
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "table_number" integer,
    "menu_item_id" "text",
    "menu_item_name" "text",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by_email" "text",
    CONSTRAINT "alerts_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'RESOLVED'::"text"]))),
    CONSTRAINT "alerts_type_check" CHECK (("type" = ANY (ARRAY['TABLE_ISSUE'::"text", 'BILL_REQUEST'::"text", 'STOCK_SHORTAGE'::"text", 'HELP_REQUEST'::"text", 'GENERAL'::"text"])))
);

ALTER TABLE ONLY "public"."alerts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "target_station" "public"."StationType" DEFAULT 'KITCHEN'::"public"."StationType"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventories" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "stock" numeric(10,2) NOT NULL,
    "unit" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."inventories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kds_settings" (
    "id" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "settings" "jsonb" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."kds_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_item_extras" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "menu_item_id" "text" NOT NULL,
    "inventory_id" "text",
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "restaurant_id" "text" NOT NULL
);


ALTER TABLE "public"."menu_item_extras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_item_ingredients" (
    "id" "text" NOT NULL,
    "menu_item_id" "text" NOT NULL,
    "inventory_id" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "restaurant_id" "text" NOT NULL
);


ALTER TABLE "public"."menu_item_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "category_id" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "price_non_negative" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_item_extras" (
    "id" "text" NOT NULL,
    "order_item_id" "text" NOT NULL,
    "extra_id" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."order_item_extras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "order_id" "text" NOT NULL,
    "menu_item_id" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "notes" "text",
    CONSTRAINT "qty_positive" CHECK (("quantity" > 0))
);

ALTER TABLE ONLY "public"."order_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "table_id" "text",
    "restaurant_id" "text" NOT NULL,
    "status" "public"."OrderStatus" DEFAULT 'PENDING'::"public"."OrderStatus" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "user_id" "text",
    "validated_at" timestamp with time zone,
    "preparing_at" timestamp with time zone,
    "ready_at" timestamp with time zone,
    "session_id" "uuid",
    "bar_ready" boolean DEFAULT false,
    "kitchen_ready" boolean DEFAULT false,
    "kitchen_preparing" boolean DEFAULT false NOT NULL,
    "bar_preparing" boolean DEFAULT false NOT NULL,
    "station" "text",
    "parent_order_id" "uuid",
    CONSTRAINT "orders_station_check" CHECK (("station" = ANY (ARRAY['KITCHEN'::"text", 'BAR'::"text"])))
);

ALTER TABLE ONLY "public"."orders" REPLICA IDENTITY FULL;


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" "text" NOT NULL,
    "period" "text" DEFAULT '/mes'::"text" NOT NULL,
    "description" "text",
    "features" "text"[],
    "popular" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_themes" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "palette_name" "text",
    "primary_color" "text" NOT NULL,
    "secondary_color" "text" NOT NULL,
    "background_color" "text" NOT NULL,
    "accent_color" "text" NOT NULL,
    "text_color" "text" NOT NULL,
    "card_background" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" DEFAULT 'Tema sin nombre'::"text" NOT NULL,
    "is_custom" boolean DEFAULT false,
    "is_active" boolean DEFAULT false,
    "font_title" "text" DEFAULT 'Outfit'::"text" NOT NULL,
    "font_body" "text" DEFAULT 'Inter'::"text" NOT NULL,
    "logo_url" "text",
    "font_accent" "text" DEFAULT 'Outfit'::"text"
);


ALTER TABLE "public"."restaurant_themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "public"."SubscriptionStatus" DEFAULT 'ACTIVE'::"public"."SubscriptionStatus" NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "plan_id" "text",
    "stripeCustomerId" "text",
    "stripeSubscriptionId" "text",
    "stripePriceId" "text",
    "currentPeriodEnd" timestamp with time zone
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "table_id" "uuid",
    "session_id" "uuid",
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tables" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "number" integer NOT NULL,
    "label" "text",
    "status" "public"."TableStatus" DEFAULT 'FREE'::"public"."TableStatus" NOT NULL,
    "qr_data" "text" NOT NULL,
    "restaurant_id" "text" NOT NULL,
    "help_requested" boolean DEFAULT false NOT NULL,
    "bill_requested" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "current_session_id" "uuid",
    "tip_included" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."tables" REPLICA IDENTITY FULL;


ALTER TABLE "public"."tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."Role" DEFAULT 'CLIENTE'::"public"."Role" NOT NULL,
    "restaurant_id" "text",
    "push_token" "text",
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventories"
    ADD CONSTRAINT "inventories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kds_settings"
    ADD CONSTRAINT "kds_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_item_extras"
    ADD CONSTRAINT "menu_item_extras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_item_ingredients"
    ADD CONSTRAINT "menu_item_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_item_extras"
    ADD CONSTRAINT "order_item_extras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_restaurant_id_key" UNIQUE ("user_id", "restaurant_id");



ALTER TABLE ONLY "public"."restaurant_themes"
    ADD CONSTRAINT "restaurant_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "categories_id_restaurant_id_key" ON "public"."categories" USING "btree" ("id", "restaurant_id");



CREATE INDEX "categories_restaurant_id_idx" ON "public"."categories" USING "btree" ("restaurant_id");



CREATE INDEX "idx_alerts_status" ON "public"."alerts" USING "btree" ("restaurant_id", "status", "created_at" DESC);



CREATE INDEX "idx_menu_item_extras_menu_item" ON "public"."menu_item_extras" USING "btree" ("menu_item_id");



CREATE INDEX "idx_menu_item_ingredients_inventory" ON "public"."menu_item_ingredients" USING "btree" ("inventory_id");



CREATE INDEX "idx_menu_item_ingredients_menu_item" ON "public"."menu_item_ingredients" USING "btree" ("menu_item_id");



CREATE INDEX "idx_menu_items_active" ON "public"."menu_items" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_order_item_extras_extra" ON "public"."order_item_extras" USING "btree" ("extra_id");



CREATE INDEX "idx_order_item_extras_item" ON "public"."order_item_extras" USING "btree" ("order_item_id");



CREATE INDEX "idx_order_items_menu_item" ON "public"."order_items" USING "btree" ("menu_item_id");



CREATE INDEX "idx_orders_parent_order_id" ON "public"."orders" USING "btree" ("parent_order_id");



CREATE INDEX "idx_orders_restaurant_id" ON "public"."orders" USING "btree" ("restaurant_id");



CREATE INDEX "idx_orders_session_id" ON "public"."orders" USING "btree" ("session_id");



CREATE INDEX "idx_orders_station" ON "public"."orders" USING "btree" ("station");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_tables_current_session_id" ON "public"."tables" USING "btree" ("current_session_id");



CREATE INDEX "idx_users_restaurant_id" ON "public"."users" USING "btree" ("restaurant_id");



CREATE INDEX "inventories_restaurant_id_idx" ON "public"."inventories" USING "btree" ("restaurant_id");



CREATE INDEX "kds_settings_restaurant_id_idx" ON "public"."kds_settings" USING "btree" ("restaurant_id");



CREATE UNIQUE INDEX "kds_settings_restaurant_id_key" ON "public"."kds_settings" USING "btree" ("restaurant_id");



CREATE INDEX "menu_item_extras_restaurant_id_idx" ON "public"."menu_item_extras" USING "btree" ("restaurant_id");



CREATE UNIQUE INDEX "menu_item_ingredients_menu_item_id_inventory_id_key" ON "public"."menu_item_ingredients" USING "btree" ("menu_item_id", "inventory_id");



CREATE INDEX "menu_item_ingredients_restaurant_id_idx" ON "public"."menu_item_ingredients" USING "btree" ("restaurant_id");



CREATE INDEX "menu_items_category_id_restaurant_id_idx" ON "public"."menu_items" USING "btree" ("category_id", "restaurant_id");



CREATE UNIQUE INDEX "menu_items_id_restaurant_id_key" ON "public"."menu_items" USING "btree" ("id", "restaurant_id");



CREATE INDEX "menu_items_restaurant_id_idx" ON "public"."menu_items" USING "btree" ("restaurant_id");



CREATE INDEX "order_item_extras_restaurant_id_idx" ON "public"."order_item_extras" USING "btree" ("restaurant_id");



CREATE INDEX "order_items_order_id_restaurant_id_idx" ON "public"."order_items" USING "btree" ("order_id", "restaurant_id");



CREATE INDEX "order_items_restaurant_id_idx" ON "public"."order_items" USING "btree" ("restaurant_id");



CREATE UNIQUE INDEX "orders_id_restaurant_id_key" ON "public"."orders" USING "btree" ("id", "restaurant_id");



CREATE INDEX "orders_ready_at_idx" ON "public"."orders" USING "btree" ("restaurant_id", "ready_at") WHERE ("ready_at" IS NOT NULL);



CREATE INDEX "orders_restaurant_id_idx" ON "public"."orders" USING "btree" ("restaurant_id");



CREATE INDEX "orders_session_id_idx" ON "public"."orders" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE UNIQUE INDEX "restaurants_slug_key" ON "public"."restaurants" USING "btree" ("slug");



CREATE INDEX "reviews_restaurant_idx" ON "public"."reviews" USING "btree" ("restaurant_id", "created_at" DESC);



CREATE INDEX "tables_current_session_id_idx" ON "public"."tables" USING "btree" ("current_session_id");



CREATE UNIQUE INDEX "tables_id_restaurant_id_key" ON "public"."tables" USING "btree" ("id", "restaurant_id");



CREATE UNIQUE INDEX "tables_qr_data_key" ON "public"."tables" USING "btree" ("qr_data");



CREATE INDEX "tables_restaurant_id_idx" ON "public"."tables" USING "btree" ("restaurant_id");



CREATE UNIQUE INDEX "tables_restaurant_id_number_key" ON "public"."tables" USING "btree" ("restaurant_id", "number");



CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING "btree" ("email");



CREATE INDEX "users_restaurant_id_idx" ON "public"."users" USING "btree" ("restaurant_id");



CREATE OR REPLACE TRIGGER "tr_only_one_active_theme" BEFORE INSERT OR UPDATE ON "public"."restaurant_themes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_active_theme"();



CREATE OR REPLACE TRIGGER "tr_order_status_validation" BEFORE INSERT OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."validate_order_transition"();



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventories"
    ADD CONSTRAINT "inventories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."kds_settings"
    ADD CONSTRAINT "kds_settings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_item_extras"
    ADD CONSTRAINT "menu_item_extras_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."menu_item_extras"
    ADD CONSTRAINT "menu_item_extras_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_item_extras"
    ADD CONSTRAINT "menu_item_extras_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_item_ingredients"
    ADD CONSTRAINT "menu_item_ingredients_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_item_ingredients"
    ADD CONSTRAINT "menu_item_ingredients_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_item_ingredients"
    ADD CONSTRAINT "menu_item_ingredients_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_category_id_restaurant_id_fkey" FOREIGN KEY ("category_id", "restaurant_id") REFERENCES "public"."categories"("id", "restaurant_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_item_extras"
    ADD CONSTRAINT "order_item_extras_extra_id_fkey" FOREIGN KEY ("extra_id") REFERENCES "public"."menu_item_extras"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_item_extras"
    ADD CONSTRAINT "order_item_extras_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_item_extras"
    ADD CONSTRAINT "order_item_extras_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_restaurant_id_fkey" FOREIGN KEY ("order_id", "restaurant_id") REFERENCES "public"."orders"("id", "restaurant_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurant_themes"
    ADD CONSTRAINT "restaurant_themes_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON UPDATE CASCADE ON DELETE SET NULL;



CREATE POLICY "Admins can manage their themes" ON "public"."restaurant_themes" TO "authenticated" USING (("restaurant_id" = (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'restaurant_id'::"text")));



CREATE POLICY "Public themes access" ON "public"."restaurant_themes" FOR SELECT USING (true);



ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "alerts_tenant" ON "public"."alerts" USING (("restaurant_id" = "public"."get_auth_restaurant_id"())) WITH CHECK (("restaurant_id" = "public"."get_auth_restaurant_id"()));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_order_items" ON "public"."order_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "insert_orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."inventories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kds_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_item_extras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_item_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_item_extras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_public_read" ON "public"."plans" FOR SELECT USING (true);



CREATE POLICY "public_read_categories" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "public_read_menu_items" ON "public"."menu_items" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "public_read_restaurant_themes" ON "public"."restaurant_themes" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "public_read_restaurants" ON "public"."restaurants" FOR SELECT TO "authenticated", "anon" USING (("status" = 'ACTIVE'::"public"."SubscriptionStatus"));



CREATE POLICY "public_read_tables" ON "public"."tables" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "push_sub_admin_read" ON "public"."push_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ((("u"."raw_app_meta_data" ->> 'restaurant_id'::"text"))::"uuid" = "push_subscriptions"."restaurant_id") AND (("u"."raw_app_meta_data" ->> 'role'::"text") = ANY (ARRAY['ADMIN'::"text", 'COCINA'::"text"]))))));



CREATE POLICY "push_sub_own" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurant_themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_insert_public" ON "public"."reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "reviews_read_admin" ON "public"."reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ((("u"."raw_app_meta_data" ->> 'restaurant_id'::"text"))::"uuid" = "reviews"."restaurant_id")))));



CREATE POLICY "select_order_items" ON "public"."order_items" FOR SELECT USING (("restaurant_id" = "public"."get_auth_restaurant_id"()));



CREATE POLICY "select_orders" ON "public"."orders" FOR SELECT USING (("restaurant_id" = "public"."get_auth_restaurant_id"()));



CREATE POLICY "self_restaurant_access" ON "public"."restaurants" USING (("id" = "public"."get_auth_restaurant_id"()));



ALTER TABLE "public"."tables" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_access_policy" ON "public"."alerts" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."categories" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."inventories" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."menu_item_extras" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."menu_item_ingredients" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."menu_items" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."order_item_extras" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."order_items" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."orders" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "tenant_access_policy" ON "public"."tables" USING (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id"))) WITH CHECK (("restaurant_id" = ( SELECT "public"."get_auth_restaurant_id"() AS "get_auth_restaurant_id")));



CREATE POLICY "update_order_items" ON "public"."order_items" FOR UPDATE USING (("restaurant_id" = "public"."get_auth_restaurant_id"())) WITH CHECK (("restaurant_id" = "public"."get_auth_restaurant_id"()));



CREATE POLICY "update_orders" ON "public"."orders" FOR UPDATE USING (("restaurant_id" = "public"."get_auth_restaurant_id"())) WITH CHECK (("restaurant_id" = "public"."get_auth_restaurant_id"()));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_tenant_access" ON "public"."users" USING ((("restaurant_id" = "public"."get_auth_restaurant_id"()) OR ("id" = ("auth"."uid"())::"text")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."alerts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."order_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."restaurant_themes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tables";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."completar_pago_mesa"("p_order_ids" "text"[], "p_table_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_restaurant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_restaurant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_restaurant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_active_theme"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_active_theme"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_active_theme"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_auth_user_sync"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_order_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_order_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_order_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_order_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_order_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_order_transition"() TO "service_role";


















GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."inventories" TO "anon";
GRANT ALL ON TABLE "public"."inventories" TO "authenticated";
GRANT ALL ON TABLE "public"."inventories" TO "service_role";



GRANT ALL ON TABLE "public"."kds_settings" TO "anon";
GRANT ALL ON TABLE "public"."kds_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."kds_settings" TO "service_role";



GRANT ALL ON TABLE "public"."menu_item_extras" TO "anon";
GRANT ALL ON TABLE "public"."menu_item_extras" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_item_extras" TO "service_role";



GRANT ALL ON TABLE "public"."menu_item_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."menu_item_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_item_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_item_extras" TO "anon";
GRANT ALL ON TABLE "public"."order_item_extras" TO "authenticated";
GRANT ALL ON TABLE "public"."order_item_extras" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_themes" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_themes" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."tables" TO "anon";
GRANT ALL ON TABLE "public"."tables" TO "authenticated";
GRANT ALL ON TABLE "public"."tables" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


