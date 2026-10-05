import {recordedRevenue} from './orderStatus.js';

export function summarizeAdminAnalytics(orders=[],variants=[],products=[],{now=new Date(),months=6}={}){
  const variantProducts=new Map(variants.map(variant=>[variant.id,variant.product_id]));
  const catalog=new Map(products.map(product=>[product.id,product]));
  const monthly=new Map(Array.from({length:months},(_,index)=>{
    const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-months+index+1,1));
    return [date.toISOString().slice(0,7),{label:date.toLocaleDateString('en-PK',{month:'short',year:'2-digit',timeZone:'UTC'}),value:0}];
  }));
  const pairs=new Map(),categories=new Map();
  for(const order of orders){
    if(order.payment_status!=='paid')continue;
    const period=monthly.get(String(order.created_at).slice(0,7));
    if(period)period.value+=Number(order.total_cents||0);
    for(const item of order.order_items||[]){
      const product=catalog.get(variantProducts.get(item.variant_id));
      const productKey=product?.id||`archived:${item.product_name}`;
      const category=product?.categories?.name||'Archived / uncategorized pairs';
      const value=Number(item.unit_price_cents||0)*Number(item.quantity||0);
      const pair=pairs.get(productKey)||{label:product?.name||item.product_name||'Archived pair',value:0,quantity:0};
      pair.value+=value;pair.quantity+=Number(item.quantity||0);pairs.set(productKey,pair);
      const collection=categories.get(category)||{label:category,value:0,quantity:0};
      collection.value+=value;collection.quantity+=Number(item.quantity||0);categories.set(category,collection);
    }
  }
  const rank=map=>[...map.values()].sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label)).slice(0,8);
  return {totalOrders:orders.length,revenueCents:recordedRevenue(orders),completedOrders:orders.filter(order=>order.status==='delivered').length,monthlyRevenue:[...monthly.values()],topProducts:rank(pairs),categoryRevenue:rank(categories)};
}
