/**
 * Slug-based entry point para kitchen-kds.
 * El slug identifica la organización; el auth context (COCINA role + restaurantId)
 * viene del JWT de Supabase. El middleware valida el rol antes de llegar aquí.
 */
import KitchenPage from '../page';

export default KitchenPage;
