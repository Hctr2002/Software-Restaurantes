/**
 * Slug-based entry point para waiter-terminal.
 * El slug identifica la organización; el auth context (GARZON role + restaurantId)
 * viene del JWT de Supabase. El middleware valida el rol antes de llegar aquí.
 */
import WaiterPage from '../page';

export default WaiterPage;
