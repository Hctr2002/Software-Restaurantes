/**
 * Slug-based entry point para cashier-dashboard.
 * El slug identifica la organización; el auth context (CAJERO role + restaurantId)
 * viene del JWT de Supabase. El middleware valida el rol antes de llegar aquí.
 */
import CashierPage from '../page';

export default CashierPage;
