"use client";

import { use, useState, useEffect } from "react";
import { 
  useTableOrders,
  useCustomerOrderTracker,
  useMenu,
  useCustomerPortal,
} from '@menu-bites/auth';
import { useTenant } from '@/context/TenantContext';
import {
  OrderTracker,
  RatingModal,
  CuentaSheet,
  PremiumHeader,
  PortalPrimaryButton,
} from '@menu-bites/ui';
import { Loader2, Store, ShoppingBag, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Módulos extraídos para cumplir con el límite de 400 líneas
// Función para heredar la navegación de categorías y sincronizar con el scroll.
import { CategoryNav } from "./_components/CategoryNav";
// Función para heredar el listado de platos y aplicar el filtrado dinámico.
import { MenuSection } from "./_components/MenuSection";
// Función para heredar el resumen de compra y gestionar el envío del pedido.
import { CheckoutModal } from "./_components/CheckoutModal";
// Función para heredar el feedback visual de éxito tras realizar un pedido.
import { ConfirmationOverlay } from "./_components/ConfirmationOverlay";
// Función para heredar los botones de acción rápida de la cuenta y el pago.
import { AccountActions } from "./_components/AccountActions";

/**
 * Página principal del menú del cliente.
 * Coordina la lógica de navegación, carrito, seguimiento de pedidos y feedback.
 * // Función para heredar el estado global del restaurante y sincronizar la UI con el tema dinámico.
 */
export default function MenuPage({
  params: paramsPromise,
}: {
  params: Promise<{ restaurantSlug: string; tableNumber: string }>;
}) {
  const params = use(paramsPromise);
  const { restaurant } = useTenant();

  const { menu: items, categories, loading: menuLoading } = useMenu(restaurant?.id);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const portal = useCustomerPortal(restaurant?.id, params.tableNumber);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [billRequested, setBillRequested]       = useState(false);

  const { status: currentTrackerStatus } = useCustomerOrderTracker(portal.order.lastId);
  const { orders: tableOrders } = useTableOrders(portal.table.data?.id, portal.table.data?.current_session_id);

  const [showRating, setShowRating]       = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [stars, setStars]                 = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]       = useState(false);

  const [isCuentaOpen, setIsCuentaOpen]     = useState(false);

  // Función para heredar la confirmación de pedido y resetear el estado local tras un éxito.
  const handlePlaceOrder = async () => {
    const success = await portal.placeOrder();
    if (success) setIsCheckoutOpen(false);
  };

  useEffect(() => {
    if (!currentTrackerStatus || !portal.order.lastId) return;
    if (currentTrackerStatus === 'DELIVERED') {
      setRatingOrderId(portal.order.lastId);
      setTimeout(() => setShowRating(true), 1500);
    }
  }, [currentTrackerStatus, portal.order.lastId]);

  // Función para enviar la calificación del servicio al servidor.
  const handleSubmitRating = async () => {
    if (!stars || !ratingOrderId || !restaurant?.id) return;
    setRatingSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:      ratingOrderId,
          restaurant_id: restaurant.id,
          table_id:      portal.table.data?.id ?? null,
          rating:        stars,
          comment:       ratingComment,
        }),
      });
      setRatingDone(true);
      setTimeout(() => {
        setShowRating(false);
        setStars(0);
        setRatingComment('');
        setRatingDone(false);
        setRatingOrderId(null);
      }, 2000);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Función para solicitar la cuenta desde la mesa y notificar al sistema.
  const handleRequestBill = async () => {
    if (!portal.table.data || isRequestingBill || billRequested || !restaurant?.id) return;
    setIsRequestingBill(true);
    try {
      const res = await fetch('/api/bill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table_id: portal.table.data.id,
          restaurant_id: restaurant.id,
          table_number: portal.table.data.number
        }),
      });
      if (res.ok) setBillRequested(true);
    } catch {
    } finally {
      setIsRequestingBill(false);
    }
  };

  // Función para solicitar asistencia del mozo a la mesa.
  const handleCallWaiter = async () => {
    if (!portal.table.data || !restaurant?.id) return;
    try {
      await fetch('/api/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table_id: portal.table.data.id,
          restaurant_id: restaurant.id,
          table_number: portal.table.data.number
        }),
      });
    } catch (err) {
      console.error('Error calling waiter:', err);
    }
  };

  useEffect(() => {
    (window as any).handleCallWaiter = handleCallWaiter;
    return () => { delete (window as any).handleCallWaiter; };
  }, [portal.table.data, restaurant?.id]);

  // Función para heredar el estado de carga y mostrar un spinner temático con la fuente del sistema.
  if (menuLoading || !items) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" aria-hidden="true" />
        <PortalText className="text-foreground/60 font-medium">
          Cargando menú de {restaurant?.name}…
        </PortalText>
      </div>
    );
  }

  return (
      <div className="min-h-screen wow-gradient text-foreground pb-32">
        <ConfirmationOverlay 
          show={portal.order.success} 
          tableData={portal.table.data} 
          restaurantName={restaurant?.name || ''} 
          onClose={() => portal.resetOrder()} 
        />

        {/* Bloque de Navegación Unificado Pro Max */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md shadow-2xl border-b border-foreground/5">
          <div className="p-4 lg:p-6 pb-2">
            <PremiumHeader
              title={restaurant?.name || ''}
              icon={Store}
              variant="compact"
              statusLabel="En Servicio"
              statusSubLabel={portal.table.data ? `Mesa ${portal.table.data.number}` : "Escanea tu mesa"}
              isSolid
              className="border border-foreground/10"
              actions={
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* // Función para heredar el botón de búsqueda con estilo ghost dinámico */}
                  <PortalPrimaryButton 
                    variant="ghost" 
                    className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center bg-foreground/5 border-foreground/10 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Search className="w-5 h-5" />
                  </PortalPrimaryButton>
                  
                  <div className="relative">
                    {/* // Función para heredar el botón del carrito con el color primario del restaurante */}
                    <PortalPrimaryButton 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCheckoutOpen(true)} 
                      className="w-12 h-12 sm:w-14 sm:h-14 p-0 rounded-2xl shadow-xl shadow-primary/30 group relative overflow-hidden"
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-tr from-primary-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <ShoppingBag className="w-6 h-6 text-primary-foreground relative z-10" />
                    </PortalPrimaryButton>
                    
                    <AnimatePresence>
                      {/* // Función para mostrar el contador de productos en el carrito con estilo dinámico */}
                      {portal.cartCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-[3px] border-background shadow-lg z-20"
                        >
                          {/* // Función para heredar la tipografía del cuerpo en el contador del carrito */}
                          <PortalText as="span" font="body">
                            {portal.cartCount}
                          </PortalText>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              }
            />
          </div>
          
          <CategoryNav 
            categories={categories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />
        </div>

        <MenuSection 
          categoryName={categories.find((c) => c.id === activeCategory)?.name ?? 'Carta Completa'} 
          activeCategory={activeCategory} 
          categories={categories}
          items={activeCategory ? items.filter((item) => item.categoryId === activeCategory) : items} 
          cart={portal.order.cart} 
          onAdd={portal.addToCart} 
          onDecrement={portal.removeFromCart} 
        />

        {isCheckoutOpen && (
          <CheckoutModal 
            cart={portal.order.cart} 
            cartTotal={portal.cartTotal} 
            table={{ ...portal.table, orderError: portal.order.error }} 
            onPlaceOrder={handlePlaceOrder} 
            onClose={() => setIsCheckoutOpen(false)} 
            placing={portal.order.placing} 
          />
        )}

        {showRating && (
          <RatingModal 
            restaurantName={restaurant?.name || ''} 
            stars={stars} 
            comment={ratingComment} 
            submitting={ratingSubmitting} 
            done={ratingDone} 
            onStarsChange={setStars} 
            onCommentChange={setRatingComment} 
            onSubmit={handleSubmitRating} 
            onSkip={() => setShowRating(false)} 
          />
        )}

        {/* // Función para heredar el tracker de estado de pedido en tiempo real */}
        {portal.order.lastId && currentTrackerStatus && currentTrackerStatus !== 'DELIVERED' && currentTrackerStatus !== 'COMPLETED' && currentTrackerStatus !== 'REJECTED' && (
          <OrderTracker status={currentTrackerStatus} />
        )}

        {isCuentaOpen && portal.table.data && (
          <CuentaSheet 
            tableLabel={String(portal.table.data.number)} 
            orders={tableOrders} 
            onClose={() => setIsCuentaOpen(false)} 
          />
        )}

        {/* // Función para heredar las acciones globales de la cuenta y el carrito */}
        <AccountActions 
          tableData={portal.table.data} 
          tableOrdersCount={tableOrders.length} 
          cartCount={portal.cartCount} 
          cartTotal={portal.cartTotal} 
          billRequested={billRequested} 
          isRequestingBill={isRequestingBill} 
          isCheckoutOpen={isCheckoutOpen} 
          onOpenCuenta={() => setIsCuentaOpen(true)} 
          onOpenCheckout={() => setIsCheckoutOpen(true)} 
          onConfirmBill={handleRequestBill} 
        />
      </div>
  );
}
