import { supabase } from "../lib/supabase";
import { summarizeAdminAnalytics } from '../lib/adminAnalytics';

export async function getAnalytics() {
  const [orders,variants,products]=await Promise.all([
    supabase.from('orders').select('id,total_cents,status,payment_status,created_at,order_items(variant_id,product_name,unit_price_cents,quantity)'),
    supabase.from('product_variants').select('id,product_id'),
    supabase.from('products').select('id,name,categories(name)'),
  ]);
  for(const result of [orders,variants,products])if(result.error)throw result.error;
  return summarizeAdminAnalytics(orders.data||[],variants.data||[],products.data||[]);
}
