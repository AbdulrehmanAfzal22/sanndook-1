// Sample brand directory is only used by explicit, read-only store preview mode.
export const initialBrandNames=['Nike','Adidas','Puma','New Balance','ASICS','Reebok','Converse','Vans','Skechers','Under Armour','On','HOKA','Gucci','Balenciaga','Prada','Clarks','Timberland','Crocs'];
export const brandSlug=name=>name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const previewBrands=initialBrandNames.map((name,index)=>({id:'preview-'+brandSlug(name),name,slug:brandSlug(name),departments:['men','women','kids'],sort_order:(index+1)*10,is_active:true}));
