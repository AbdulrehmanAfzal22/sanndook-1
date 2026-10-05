export function validateShoeDetails(form,{isAccessory=false}={}){
 if(!String(form.brand||'').trim())throw new Error('Enter the shoe brand.');
 if(!['EU','UK','US-M','US-W'].includes(form.size_system||'EU'))throw new Error('Choose a supported shoe size system.');
 if(form.status==='published'&&form.condition!=='new'&&!String(form.condition_notes||'').trim())throw new Error('Describe the actual condition of this pair.');
 if(form.compare_at_price&&Number(form.compare_at_price)<=Number(form.price))throw new Error('The previous price must be higher than the sale price.');
 if(!isAccessory&&(form.variants||[]).some(v=>!/^\d{1,2}(\.5)?$/.test(String(v.size))||Number(v.size)<=0||Number(v.size)>55))throw new Error('Use numeric shoe sizes, with optional half sizes.');
 if((form.variants||[]).some(v=>v.sku&&v.sku.length>80))throw new Error('SKUs can contain up to 80 characters.');
}
