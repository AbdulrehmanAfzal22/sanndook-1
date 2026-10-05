export const conditions={new:'Brand new',store_returns:'Store returns',premium:'Premium preloved',excellent:'Excellent',good:'Good'};
export function availableVariants(product){return (product.product_variants||[]).filter(v=>v.active&&v.stock>0);}
export function selectedBrands(params){
 const values=params instanceof URLSearchParams?params.getAll('brand'):Array.isArray(params?.brand)?params.brand:[params?.brand];
 const seen=new Set();
 return values.map(value=>String(value||'').trim()).filter(value=>{
  const key=value.toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;
 });
}
export function toggleBrand(params,brand){
 const next=new URLSearchParams(params),values=selectedBrands(next),key=brand.trim().toLowerCase();
 const exists=values.some(value=>value.toLowerCase()===key);
 next.delete('brand');
 for(const value of exists?values.filter(value=>value.toLowerCase()!==key):[...values,brand.trim()])next.append('brand',value);
 return next;
}
export function filterFootwear(products,params){
 const read=k=>params instanceof URLSearchParams?params.get(k):params[k];
 const q=(read('q')||'').trim().toLowerCase();
 const min=Number(read('min')||0),max=read('max')?Number(read('max')):Infinity;
 const brands=selectedBrands(params).map(value=>value.toLowerCase());
 const result=products.filter(p=>{
  if(q&&![p.name,p.brand,p.description,p.categories?.name].join(' ').toLowerCase().includes(q))return false;
  if(read('category')&&!['all',p.category_id,p.categories?.slug].includes(read('category')))return false;
  if(read('department')&&p.department!==read('department')&&!(read('department')!=='kids'&&p.department==='unisex'))return false;
  if(brands.length&&!brands.includes(String(p.brand||'').trim().toLowerCase()))return false;
  if(read('condition')==='preloved'&&!['premium','excellent','good'].includes(p.condition))return false;
  if(read('condition')&&read('condition')!=='preloved'&&p.condition!==read('condition'))return false;
  if(read('width')&&p.width!==read('width'))return false;
  if((read('size')||read('size_system'))&&(p.size_system||'EU')!==(read('size_system')||'EU'))return false;
  if(p.price_cents<min*100||p.price_cents>max*100)return false;
  if(read('sale')&&!(p.compare_at_cents>p.price_cents))return false;
  return (p.product_variants||[]).some(v=>v.active&&(!read('size')||v.size===read('size'))&&(!read('color')||v.color===read('color'))&&(!read('stock')||v.stock>0));
 });
 return result.sort((a,b)=>read('sort')==='price-low'?a.price_cents-b.price_cents:read('sort')==='price-high'?b.price_cents-a.price_cents:read('sort')==='name'?a.name.localeCompare(b.name):new Date(b.created_at)-new Date(a.created_at));
}
export function discountPercent(p){return p.compare_at_cents>p.price_cents?Math.round((1-p.price_cents/p.compare_at_cents)*100):0;}
