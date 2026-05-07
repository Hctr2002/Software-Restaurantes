"use client";

import { use, useState, useEffect, useRef } from "react";
import { 
  useTableOrders, 
  useCustomerOrderTracker, 
  useThemeSync, 
  useMenu,
  useCustomerPortal 
} from '@menu-bites/auth';
import { useTenant } from '@/context/TenantContext';
import { 
  OrderTracker, 
  RatingModal, 
  CuentaSheet 
} from '@menu-bites/ui';
import { Loader2 } from "lucide-react";

// Módulos extraídos para cumplir con el límite de 400 líneas
import { MenuHeader } from "./_components/MenuHeader";
import { CategoryNav } from "./_components/CategoryNav";
import { MenuSection } from "./_components/MenuSection";
import { CheckoutModal } from "./_components/CheckoutModal";
import { ConfirmationOverlay } from "./_components/ConfirmationOverlay";
import { AccountActions } from "./_components/AccountActions";

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
  const { orders: tableOrders } = useTableOrders(portal.table.data?.id);
  useThemeSync(restaurant?.id);

  const [showRating, setShowRating]       = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [stars, setStars]                 = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]       = useState(false);

  const [isCuentaOpen, setIsCuentaOpen]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const handleTableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); 
    portal.setTableInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      portal.validateTable(value);
    }, 500);
  };

  const handlePlaceOrder = async () => {
    await portal.placeOrder();
    if (portal.order.success) setIsCheckoutOpen(false);
  };

  useEffect(() => {
    if (!currentTrackerStatus || !portal.order.lastId) return;
    if (currentTrackerStatus === 'DELIVERED') {
      setRatingOrderId(portal.order.lastId);
      setTimeout(() => setShowRating(true), 1500);
    }
  }, [currentTrackerStatus, portal.order.lastId]);

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

  if (menuLoading || !items) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-sage animate-spin mb-4" aria-hidden="true" />
        <p className="text-sand/60 font-medium">Cargando menú de {restaurant?.name}…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <ConfirmationOverlay 
        show={portal.order.success} 
        tableData={portal.table.data} 
        restaurantName={restaurant?.name || ''} 
        onClose={() => portal.setOrderSuccess(false)} 
      />

      <MenuHeader 
        restaurantName={restaurant?.name || ''} 
        tableData={portal.table.data} 
        cartCount={portal.cartCount} 
        onOpenCheckout={() => setIsCheckoutOpen(true)} 
      />

      <CategoryNav 
        categories={categories} 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />

      <MenuSection 
        categoryName={categories.find((c) => c.id === activeCategory)?.name ?? 'Nuestros Platos'} 
        activeCategory={activeCategory} 
        items={items.filter((item) => item.categoryId === activeCategory)} 
        cart={portal.order.cart} 
        onAdd={portal.addToCart} 
        onDecrement={portal.removeFromCart} 
      />

      {isCheckoutOpen && (
        <CheckoutModal 
          cart={portal.order.cart} 
          cartTotal={portal.cartTotal} 
          table={{ ...portal.table, orderError: portal.order.error }} 
          onTableInputChange={handleTableInputChange} 
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

      {portal.order.lastId && currentTrackerStatus !== 'DELIVERED' && currentTrackerStatus !== 'COMPLETED' && currentTrackerStatus !== 'REJECTED' && (
        <OrderTracker status={currentTrackerStatus} />
      )}

      {isCuentaOpen && portal.table.data && (
        <CuentaSheet 
          tableNumber={portal.table.data.number} 
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
        isCheckoutOpen={isCheckoutOpen} 
        onOpenCuenta={() => setIsCuentaOpen(true)} 
        onOpenCheckout={() => setIsCheckoutOpen(true)} 
        onConfirmBill={handleRequestBill} 
      />
    </div>
  );
}
