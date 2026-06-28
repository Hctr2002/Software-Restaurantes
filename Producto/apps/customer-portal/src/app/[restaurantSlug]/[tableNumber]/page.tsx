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
  PortalText,
} from '@menu-bites/ui';
import { Loader2, Store, ShoppingBag, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Componentes extraídos para respetar el límite de 400 líneas por archivo
import { CategoryNav } from "./_components/CategoryNav";
import { MenuSection } from "./_components/MenuSection";
import { CheckoutModal } from "./_components/CheckoutModal";
import { ConfirmationOverlay } from "./_components/ConfirmationOverlay";
import { AccountActions } from "./_components/AccountActions";
import { TipModal } from "./_components/TipModal";

/**
 * Página principal del menú del cliente: /[restaurantSlug]/[tableNumber]
 * Orquesta navegación por categorías, carrito, checkout, seguimiento de pedidos en tiempo real,
 * solicitud de cuenta y valoración del servicio.
 * El tema visual (colores, tipografías) se hereda de RestaurantThemeProvider en el layout padre.
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
  const [showTipModal, setShowTipModal]         = useState(false);
  const [isCallingWaiter, setIsCallingWaiter]   = useState(false);
  const [waiterCalled, setWaiterCalled]         = useState(false);

  const { status: currentTrackerStatus } = useCustomerOrderTracker(portal.order.lastId);
  const { orders: tableOrders } = useTableOrders(portal.table.data?.id, portal.table.data?.current_session_id);

  // Total acumulado de la mesa — para mostrar el monto de la propina en el modal.
  const tableTotal = tableOrders.reduce(
    (s: number, o: any) => s + (o.orderItems?.reduce((si: number, i: any) => si + Number(i.unitPrice) * i.quantity, 0) || 0),
    0,
  );

  const [showRating, setShowRating]       = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [stars, setStars]                 = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]       = useState(false);

  const [isCuentaOpen, setIsCuentaOpen]     = useState(false);

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

  /** Envía la valoración (1-5 estrellas) del servicio al servidor y cierra el modal tras 2s. */
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

  /**
   * Solicita la cuenta: marca bill_requested, registra el monto de propina elegido
   * por el cliente (tip_amount / tip_included) e inserta una alerta BILL_REQUEST.
   */
  const handleRequestBill = async (tipAmount: number) => {
    if (!portal.table.data || isRequestingBill || billRequested || !restaurant?.id) return;
    setIsRequestingBill(true);
    try {
      const res = await fetch('/api/bill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: portal.table.data.id,
          restaurant_id: restaurant.id,
          table_number: portal.table.data.number,
          tip_included: tipAmount > 0,
          tip_amount: tipAmount
        }),
      });
      if (res.ok) setBillRequested(true);
    } catch {
    } finally {
      setIsRequestingBill(false);
      setShowTipModal(false);
    }
  };

  /** Activa help_requested en la mesa y marca el botón como "llamado" mientras el garzón acude. */
  const handleCallWaiter = async () => {
    if (!portal.table.data || isCallingWaiter || waiterCalled || !restaurant?.id) return;
    setIsCallingWaiter(true);
    try {
      const res = await fetch('/api/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: portal.table.data.id,
          restaurant_id: restaurant.id,
          table_number: portal.table.data.number
        }),
      });
      if (res.ok) {
        setWaiterCalled(true);
        // Permite volver a llamar pasados unos segundos
        setTimeout(() => setWaiterCalled(false), 30000);
      }
    } catch (err) {
      console.error('Error calling waiter:', err);
    } finally {
      setIsCallingWaiter(false);
    }
  };

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
        <div className="sticky top-0 z-50 bg-background shadow-2xl border-b border-border">
          <div className="p-4 lg:p-6 pb-2">
            <PremiumHeader
              title={restaurant?.name || ''}
              icon={Store}
              variant="compact"
              statusLabel="En Servicio"
              statusSubLabel={portal.table.data ? `Mesa ${portal.table.data.number}` : "Escanea tu mesa"}
              isSolid
              className="border border-border"
              actions={
                <div className="flex items-center gap-2 sm:gap-3">
                  <PortalPrimaryButton 
                    variant="ghost" 
                    className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center bg-muted/30 border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Search className="w-5 h-5" />
                  </PortalPrimaryButton>
                  
                  <div className="relative">
                    <PortalPrimaryButton
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-12 h-12 sm:w-14 sm:h-14 p-0 rounded-2xl shadow-xl shadow-primary/30 group relative overflow-hidden"
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-tr from-primary-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <ShoppingBag className="w-6 h-6 text-primary-foreground relative z-10" />
                    </PortalPrimaryButton>
                    
                    <AnimatePresence>
                      {/* Badge con conteo de ítems — animado con framer-motion */}
                      {portal.cartCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-[3px] border-background shadow-lg z-20"
                        >
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

        {/* Tracker de estado visible mientras el pedido no ha sido entregado/rechazado */}
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

        <AccountActions 
          tableData={portal.table.data} 
          tableOrdersCount={tableOrders.length} 
          cartCount={portal.cartCount} 
          cartTotal={portal.cartTotal} 
          billRequested={billRequested}
          isRequestingBill={isRequestingBill}
          waiterCalled={waiterCalled}
          isCallingWaiter={isCallingWaiter}
          isCheckoutOpen={isCheckoutOpen}
          onOpenCuenta={() => setIsCuentaOpen(true)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onConfirmBill={() => setShowTipModal(true)}
          onCallWaiter={handleCallWaiter}
        />

        {showTipModal && (
          <TipModal
            tableTotal={tableTotal}
            submitting={isRequestingBill}
            onConfirm={handleRequestBill}
            onClose={() => setShowTipModal(false)}
          />
        )}
      </div>
  );
}
