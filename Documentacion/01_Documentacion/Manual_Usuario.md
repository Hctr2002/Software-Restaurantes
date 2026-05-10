# Manual de Usuario: Gestor de Menú Digital
**Proyecto:** Menu Bites
**Versión:** 1.0.0

## 1. Introducción
Este manual describe el uso del módulo de **Gestión de Inventario y Menú Dinámico** dentro de la plataforma Menu Bites. Este módulo permite a los administradores de restaurantes configurar su oferta gastronómica, gestionar existencias y personalizar la experiencia visual del cliente.

## 2. Gestión de Categorías
Las categorías agrupan los productos (ej: Entradas, Platos de Fondo, Bebidas).

1. Acceda al **Panel de Administración Local** → **Menú**.
2. Haga clic en **"Nueva Categoría"**.
3. Ingrese el nombre y establezca si la categoría está activa.
4. **Estación de destino (`target_station`):** Seleccione si los ítems de esta categoría serán gestionados por **Cocina** (`KITCHEN`) o por **Barra** (`BAR`). Esto determina en qué pantalla KDS aparecerán los tickets.
   - `KITCHEN`: Categorías de comida (Entradas, Fondos, Postres, etc.)
   - `BAR`: Categorías de bebidas (Cócteles, Jugos, Cervezas, etc.)
5. **Reordenamiento:** Utilice la función *Drag-and-Drop* (arrastrar y soltar) para cambiar el orden de aparición en el menú del cliente.

## 3. Gestión de Productos (Menu Items)
1. Dentro de una categoría, haga clic en **"Agregar Producto"**.
2. **Campos Obligatorios:**
   - **Nombre:** Identificador comercial.
   - **Precio:** Valor de venta (soporta CLP).
   - **Imagen:** Carga de archivo (Máximo 5MB). El sistema optimiza automáticamente la imagen para redes móviles (Edge Compression).
3. **Control de Visibilidad:** Use el interruptor `isActive` para ocultar productos temporalmente (ej: por quiebre de stock).

## 4. Inventario e Insumos
Cada producto puede estar vinculado a insumos específicos para control de stock.
- **Stock Bruto:** Gestión de cantidades en unidades, kg o litros.
- **Trazabilidad:** El sistema descuenta existencias automáticamente según los pedidos validados.

## 5. Menú Dinámico (QR)
- Los cambios realizados en el panel administrativo se reflejan en **milisegundos** en los terminales de los clientes gracias a la tecnología **Incremental Static Regeneration (ISR)** y **Realtime Engine**.
- **Sugerencia:** Si un producto se agota en cocina, desactívelo inmediatamente para evitar pedidos fallidos.

## 6. Estación de Barra (Bar Dashboard)

El personal de barra accede al **Bar Dashboard** (puerto 3006 en desarrollo). Esta pantalla muestra únicamente los ítems de categorías con `target_station = BAR`.

**Flujo de trabajo:**

1. El garzón toma el pedido; si incluye bebidas, el ticket aparece automáticamente en la barra.
2. El barman presiona **"Iniciar preparación"** para mover el ticket a "En Barra".
3. Al terminar, presiona **"Marcar listo"**. Si el pedido también tiene ítems de cocina, el estado global espera a que cocina también termine.
4. Cuando ambas estaciones completan sus ítems, el garzón recibe la notificación de pedido listo.

**Reportar quiebre de stock:** El botón "Alerta Stock" permite al barman notificar al administrador sobre insumos agotados sin salir de la pantalla.

**Control de disponibilidad:** Desde Configuración → "Sin Stock", el barman puede desactivar ítems de barra que no tienen stock, ocultándolos también en el menú del cliente.

---

© 2024-2026 Menu Bites | Soporte: soporte@menubites.com
