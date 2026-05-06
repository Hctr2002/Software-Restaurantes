"use client";

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Plus, Info, ChevronRight, Loader2, MapPin, AlertCircle, CheckCircle2, Receipt, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';
import {
  getCategoriesByRestaurant,
  getMenuItemsByRestaurant,
  getTableByNumber,
  placeOrder,
  getTableOrders,
  type Category,
  type MenuItem,
  type CartItem,
  type Table,
  type TableOrder,
} from '@/lib/tenant';
import { OrderTracker } from '../../_components/OrderTracker';
import { RatingModal } from '../../_components/RatingModal';
import { CuentaSheet } from '../../_components/CuentaSheet';
import { MenuItemCard } from '../../_components/MenuItemCard';

export default function MenuPage({
  params: paramsPromise,
}: {
  params: Promise<{ restaurantSlug: string; tableNumber: string }>;
}) {
  const params = use(paramsPromise);
  const { restaurant } = useTenant();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Estado de mesa
  const [tableInput, setTableInput] = useState(params.tableNumber ?? '');
  const [validatedTable, setValidatedTable] = useState<Table | null>(null);
  const [tableValidating, setTableValidating] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced]         = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [billRequested, setBillRequested]       = useState(false);

  // W2.2 — Tracker del último pedido
  const [lastOrderId, setLastOrderId]       = useState<string | null>(null);
  const [lastOrderStatus, setLastOrderStatus] = useState<string>('PENDING');

  // W5.3 — Rating post-pago
  const [showRating, setShowRating]       = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [stars, setStars]                 = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone]       = useState(false);

  // W2.2 — Mi Cuenta (pedidos acumulados de la mesa)
  const [tableOrders, setTableOrders]       = useState<TableOrder[]>([]);
  const [isCuentaOpen, setIsCuentaOpen]     = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  // Carga menú del tenant
  useEffect(() => {
    async function fetchTenantData() {
      try {
        const [cats, menuItems] = await Promise.all([
          getCategoriesByRestaurant(restaurant.id),
          getMenuItemsByRestaurant(restaurant.id),
        ]);
        setCategories(cats);
        setItems(menuItems);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      } catch (err) {
        console.error('[MenuPage] Error cargando datos del tenant:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenantData();
  }, [restaurant.id]);

  // Valida la mesa desde la URL al inicio
  useEffect(() => {
    const urlNumber = parseInt(params.tableNumber);
    if (!isNaN(urlNumber) && urlNumber > 0) {
      validateTableNumber(urlNumber.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  /**
   * Valida que el número ingresado exista en `tables` para este restaurante.
   * Usa @@unique([restaurantId, number]) del schema de Prisma.
   */
  async function validateTableNumber(value: string) {
    const num = parseInt(value);
    if (!value || isNaN(num) || num <= 0) {
      setValidatedTable(null);
      setTableError(null);
      return;
    }

    setTableValidating(true);
    setTableError(null);
    setValidatedTable(null);

    const table = await getTableByNumber(restaurant.id, num);

    if (!table) {
      setTableError(`La mesa ${num} no existe en ${restaurant.name}. Verifica el número.`);
    } else {
      setValidatedTable(table);
    }

    setTableValidating(false);
  }

  // Debounce: valida mientras escribe (500ms de pausa)
  const handleTableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // solo dígitos
    setTableInput(value);
    setValidatedTable(null);
    setTableError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validateTableNumber(value);
    }, 500);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Validación final: mesa obligatoria y válida
    if (!validatedTable) {
      setTableError('Debes ingresar un número de mesa válido para continuar.');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);
    try {
      console.log('[MenuPage] Enviando pedido → restaurantId:', restaurant.id, '| mesa:', validatedTable.number);
      const orderId = await placeOrder(restaurant.id, validatedTable.number.toString(), cart);
      console.log('[MenuPage] Pedido creado con éxito:', orderId);
      setLastOrderId(orderId);
      setLastOrderStatus('PENDING');
      setCart([]);
      setIsCheckoutOpen(false);
      setOrderSuccess(true);
      setOrderPlaced(true);
    } catch (err: any) {
      console.error('[MenuPage] Error al realizar pedido:', err);
      setOrderError(err?.message ?? 'Error al procesar el pedido. Intenta de nuevo.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // W2.2 — Cargar pedidos acumulados cuando la mesa está validada
  const fetchTableOrders = useCallback(async () => {
    if (!validatedTable) return;
    const orders = await getTableOrders(validatedTable.id);
    setTableOrders(orders);
  }, [validatedTable]);

  useEffect(() => {
    if (!validatedTable) return;
    fetchTableOrders();

    const channel = supabase
      .channel(`customer-orders-${validatedTable.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${validatedTable.id}` },
        () => { fetchTableOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [validatedTable, fetchTableOrders]);

  // W2.2 — Tracker Realtime del último pedido
  useEffect(() => {
    if (!lastOrderId) return;

    const channel = supabase
      .channel(`tracker-${lastOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${lastOrderId}` },
        (payload) => {
          const newStatus = payload.new.status as string;
          setLastOrderStatus(newStatus);
          if (newStatus === 'DELIVERED') {
            setRatingOrderId(lastOrderId);
            setTimeout(() => {
              setShowRating(true);
              setLastOrderId(null);
            }, 1500);
          } else if (newStatus === 'REJECTED') {
            setTimeout(() => setLastOrderId(null), 3000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lastOrderId]);

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
          table_id:      validatedTable?.id ?? null,
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
    if (!validatedTable || isRequestingBill || billRequested) return;
    setIsRequestingBill(true);
    try {
      const res = await fetch('/api/bill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: validatedTable.id }),
      });
      if (res.ok) setBillRequested(true);
    } catch {
    } finally {
      setIsRequestingBill(false);
    }
  };

  const filteredItems = items.filter((item) => item.categoryId === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-sage animate-spin mb-4" aria-hidden="true" />
        <p className="text-sand/60 font-medium">Cargando menú de {restaurant.name}…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Pantalla de confirmación */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center"
             style={{ backgroundColor: '#0d1117' }}>
          {/* Ícono animado */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
               style={{ backgroundColor: '#6b8f71', boxShadow: '0 0 40px rgba(107,143,113,0.4)' }}>
            <ShoppingBag style={{ width: 44, height: 44, color: '#0d1117' }} aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f5e6d3', marginBottom: 12 }}>
            ¡Pedido Confirmado!
          </h2>

          <p style={{ fontSize: 18, color: '#6b8f71', fontWeight: 600, marginBottom: 8 }}>
            En breve se acercarán a confirmar su pedido.
          </p>

          {validatedTable && (
            <p style={{ fontSize: 13, color: 'rgba(245,230,211,0.4)', marginBottom: 40 }}>
              Mesa #{validatedTable.number} · {restaurant.name}
            </p>
          )}

          <button
            onClick={() => setOrderSuccess(false)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#f5e6d3',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '12px 32px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            Volver al Menú
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-sand">{restaurant.name}</h1>
          <p className="text-xs text-sage font-medium uppercase tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {validatedTable
              ? `Mesa ${validatedTable.number}`
              : 'Indica tu mesa al confirmar'}
          </p>
        </div>
        <div className="flex gap-4">
          <button aria-label="Buscar platos" className="p-2 rounded-full hover:bg-sand/10 transition-colors">
            <Search className="w-5 h-5 text-sand/80" aria-hidden="true" />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              aria-label={`Ver carrito, ${cartCount} productos`}
              className="p-2 rounded-full bg-sage/20 text-sage hover:bg-sage/30 transition-all"
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            </button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-navy-dark text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Category Nav */}
      <nav className="mt-4 px-6 overflow-x-auto no-scrollbar flex gap-3 pb-2 sticky top-[72px] z-40 bg-navy-dark/80 backdrop-blur-sm">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-sage text-navy-dark shadow-lg shadow-sage/20 scale-105'
                : 'bg-navy-light/40 text-sand/60 border border-sand/5 hover:bg-navy-light/60'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Menu Items */}
      <section className="px-6 mt-10 space-y-6">
        <h3 className="text-lg font-semibold text-sage-light border-l-4 border-sage pl-3 uppercase tracking-widest text-sm">
          {categories.find((c) => c.id === activeCategory)?.name ?? 'Nuestros Platos'}
        </h3>
        <motion.div
          key={activeCategory}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 gap-4"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                cartQuantity={cart.find((c) => c.id === item.id)?.quantity ?? 0}
                onAdd={addToCart}
                onDecrement={(id: string) =>
                  setCart((prev) =>
                    prev
                      .map((c) => c.id === id && c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c)
                      .filter((c) => c.quantity > 0)
                  )
                }
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sand/40 italic">No hay platos disponibles en esta categoría.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md"
            onClick={() => setIsCheckoutOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-sand/10 rounded-full mx-auto mb-8" />
            <h2 className="text-2xl font-bold text-sand mb-6 flex items-center gap-3">
              <ShoppingBag className="text-sage" aria-hidden="true" />
              Detalle de su Pedido
            </h2>

            {/* Items del carrito */}
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage font-bold text-sm">
                      {item.quantity}x
                    </div>
                    <div>
                      <h4 className="text-sand font-medium">{item.name}</h4>
                      <p className="text-xs text-sand/40">${item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-sand font-bold">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Input de número de mesa — OBLIGATORIO */}
            <div className="mb-8">
              <label htmlFor="table_input" className="flex items-center gap-2 mb-3 text-sand font-bold">
                <MapPin className="w-4 h-4 text-sage" aria-hidden="true" />
                Número de mesa
                <span className="text-accent text-lg leading-none" aria-hidden="true">*</span>
              </label>

              <div className="relative">
                <input
                  id="table_input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ej: 5"
                  aria-required="true"
                  value={tableInput}
                  onChange={handleTableInputChange}
                  maxLength={3}
                  className={`w-full bg-navy-light/40 border rounded-2xl px-5 py-4 text-sand text-2xl font-black text-center tracking-widest outline-none transition-all duration-300 ${
                    validatedTable
                      ? 'border-sage bg-sage/10 text-sage'
                      : tableError
                      ? 'border-red-500/60 bg-red-500/5'
                      : 'border-white/10 focus:border-sage/50'
                  }`}
                />
                {/* Indicador de estado */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {tableValidating && (
                    <Loader2 className="w-5 h-5 text-sage animate-spin" aria-hidden="true" />
                  )}
                  {!tableValidating && validatedTable && (
                    <CheckCircle2 className="w-5 h-5 text-sage animate-in zoom-in" aria-hidden="true" />
                  )}
                  {!tableValidating && tableError && (
                    <AlertCircle className="w-5 h-5 text-red-400 animate-in zoom-in" aria-hidden="true" />
                  )}
                </div>
              </div>

              {/* Feedback */}
              {validatedTable && (
                <p className="text-sage text-sm mt-2 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Mesa {validatedTable.number} verificada ✓
                </p>
              )}
              {tableError && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  {tableError}
                </p>
              )}
            </div>

            {/* Total */}
            <div className="bg-navy-light/30 rounded-2xl p-6 mb-8 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sand/60">Subtotal</span>
                <span className="text-sand font-medium">${cartTotal.toLocaleString()}</span>
              </div>
              {validatedTable && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sand/60">Mesa</span>
                  <span className="text-sage font-semibold">#{validatedTable.number}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-sand font-bold text-lg">Total</span>
                <span className="text-sage font-black text-2xl">${cartTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Error de pedido */}
            {orderError && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {orderError}
              </div>
            )}

            <button
              disabled={isPlacingOrder || !validatedTable}
              onClick={handlePlaceOrder}
              className="w-full bg-sage hover:bg-sage-light disabled:opacity-40 disabled:cursor-not-allowed text-navy-dark py-4 px-6 rounded-2xl shadow-xl shadow-sage/20 font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                  Procesando…
                </>
              ) : (
                <>Confirmar Pedido</>
              )}
            </button>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="w-full mt-4 text-sand/40 hover:text-sand/60 font-medium py-2 transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}

      {showRating && (
        <RatingModal
          restaurantName={restaurant.name}
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

      {lastOrderId && lastOrderStatus !== 'DELIVERED' && lastOrderStatus !== 'REJECTED' && (
        <OrderTracker status={lastOrderStatus} />
      )}

      {isCuentaOpen && validatedTable && (
        <CuentaSheet
          tableNumber={validatedTable.number}
          orders={tableOrders}
          onClose={() => setIsCuentaOpen(false)}
        />
      )}

      {/* W2.2 — Botón flotante "Mi Cuenta" */}
      {orderPlaced && validatedTable && !isCheckoutOpen && tableOrders.length > 0 && (
        <div className="fixed bottom-8 left-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button
            onClick={() => setIsCuentaOpen(true)}
            aria-label="Ver mi cuenta"
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm bg-navy-light border border-sand/10 text-sand hover:bg-sand/10 transition-all active:scale-95"
          >
            <ClipboardList className="w-4 h-4 text-sage" aria-hidden="true" />
            Mi Cuenta
            <span className="bg-sage/20 text-sage text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {tableOrders.length}
            </span>
          </button>
        </div>
      )}

      {/* Floating Bill Request Button — visible once an order has been placed */}
      {orderPlaced && validatedTable && !isCheckoutOpen && (
        <div className="fixed bottom-8 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button
            onClick={handleRequestBill}
            disabled={isRequestingBill || billRequested}
            aria-label="Solicitar la cuenta"
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all active:scale-95 ${
              billRequested
                ? 'bg-green-700/80 text-white cursor-default border border-green-500/30'
                : 'bg-navy-light border border-sand/10 text-sand hover:bg-sand/10'
            }`}
          >
            {isRequestingBill ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Receipt className="w-4 h-4" aria-hidden="true" />
            )}
            {billRequested ? 'Cuenta solicitada ✓' : 'Solicitar Cuenta'}
          </button>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-sage hover:bg-sage-light text-navy-dark py-4 px-6 rounded-2xl shadow-2xl shadow-sage/20 flex justify-between items-center transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-navy-dark text-sand w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                {cartCount}
              </div>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-black tracking-widest opacity-60 leading-none">
                  Mi Pedido
                </span>
                <span className="font-bold">Confirmar Orden</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">${cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
