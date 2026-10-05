import test from 'node:test';
import assert from 'node:assert/strict';
import {filterFootwear,discountPercent,selectedBrands,toggleBrand} from '../src/lib/footwear.js';
import {createBagMerger} from '../src/lib/guestBagMerge.js';
import {shippingQuote} from '../src/lib/deliverySettings.js';
import {validateShoeDetails} from '../src/lib/shoeValidation.js';
const p=(values={})=>({id:'pair',name:'Everyday Runner',brand:'Example',department:'unisex',size_system:'EU',price_cents:500000,created_at:'2026-10-04',product_variants:[{active:true,size:'42',color:'White',stock:0},{active:true,size:'43',color:'Black',stock:1}],...values});
test('Size and stock filters must match the same variant',()=>{assert.equal(filterFootwear([p()],new URLSearchParams('size=42&stock=1')).length,0);assert.equal(filterFootwear([p()],new URLSearchParams('size=43&stock=1')).length,1);});
test('Colour and size must also match the same variant',()=>{assert.equal(filterFootwear([p()],new URLSearchParams('size=42&color=Black')).length,0);});
test('US and EU labels cannot collide in a size filter',()=>{assert.equal(filterFootwear([p({size_system:'US-M'})],new URLSearchParams('size=43')).length,0);assert.equal(filterFootwear([p({size_system:'US-M'})],new URLSearchParams('size_system=US-M&size=43')).length,1);});
test('Adult unisex pairs are excluded from children’s browsing',()=>{assert.equal(filterFootwear([p()],new URLSearchParams('department=kids')).length,0);assert.equal(filterFootwear([p()],new URLSearchParams('department=women')).length,1);});
test('Search includes brand, sorting preserves input order',()=>{const source=[p({id:'expensive',price_cents:900000}),p({id:'cheap',price_cents:100000})];assert.equal(filterFootwear(source,new URLSearchParams('q=Example&sort=price-low'))[0].id,'cheap');assert.equal(source[0].id,'expensive');});
test('Four selected brands are combined while department and size remain required',()=>{
 const source=['Nike','Gucci','Adidas','Puma','Vans'].map((brand,index)=>p({id:String(index),brand,department:'men'}));
 source.push(p({id:'wrong-department',brand:'Nike',department:'kids'}));
 const params=new URLSearchParams('department=men&brand=Nike&brand=Gucci&brand=Adidas&brand=Puma&size=43&stock=1');
 assert.deepEqual(filterFootwear(source,params).map(pair=>pair.brand),['Nike','Gucci','Adidas','Puma']);
 params.set('size','42');assert.equal(filterFootwear(source,params).length,0);
});
test('Brand selection is case-insensitive, de-duplicated and supports legacy single-brand links',()=>{
 assert.deepEqual(selectedBrands(new URLSearchParams('brand=Nike&brand=NIKE&brand=%20Gucci%20&brand=')),['Nike','Gucci']);
 assert.equal(filterFootwear([p({brand:'Nike'})],new URLSearchParams('brand=nike')).length,1);
 assert.equal(filterFootwear([p({brand:'Gucci'})],{brand:['Nike','Gucci']}).length,1);
});
test('Removing one selected brand preserves the other brands and shoe filters',()=>{
 const params=new URLSearchParams('department=women&brand=Nike&brand=Gucci&brand=Adidas&brand=Puma&size=43&stock=1&sort=price-low');
 const next=toggleBrand(params,'Gucci');assert.deepEqual(selectedBrands(next),['Nike','Adidas','Puma']);
 assert.equal(next.get('size'),'43');assert.equal(next.get('department'),'women');assert.equal(next.get('sort'),'price-low');
 assert.equal(params.getAll('brand').length,4);assert.equal(selectedBrands(toggleBrand(next,'Gucci')).length,4);
});
test('Sale browsing only includes an actual price reduction',()=>{assert.equal(discountPercent(p({compare_at_cents:1000000})),50);assert.equal(filterFootwear([p(),p({compare_at_cents:1000000})],new URLSearchParams('sale=1')).length,1);});
test('Shoe validation rejects clothing labels and invalid prior prices',()=>{const form={brand:'Example',size_system:'EU',condition:'new',price:'5000',variants:[{size:'42.5'}]};assert.doesNotThrow(()=>validateShoeDetails(form));assert.throws(()=>validateShoeDetails({...form,variants:[{size:'XL'}]}),/numeric shoe sizes/);assert.throws(()=>validateShoeDetails({...form,compare_at_price:'4000'}),/previous price/);});
test('Publishing a preloved pair requires condition notes',()=>{assert.throws(()=>validateShoeDetails({brand:'Example',status:'published',size_system:'EU',condition:'premium',variants:[{size:'42'}]}),/condition/);});

test('Preloved edit includes every used condition and excludes new stock',()=>{const products=['new','premium','excellent','good','store_returns'].map(condition=>p({condition}));assert.equal(filterFootwear(products,new URLSearchParams('condition=preloved')).length,3);});
test('Shoe-care accessories retain nonnumeric one-size options',()=>{assert.doesNotThrow(()=>validateShoeDetails({brand:'Example',variants:[{size:'One size'}]},{isAccessory:true}));});
test('Delivery quote handles initial settings and exact free-delivery threshold',()=>{assert.equal(shippingQuote(500000,null),30000);assert.equal(shippingQuote(1199999),30000);assert.equal(shippingQuote(1200000),0);assert.equal(shippingQuote(500000,{shipping_fee_cents:45000,free_shipping_threshold_cents:1500000}),45000);});

test('Concurrent route imports add each guest pair only once',async()=>{let rows=[{variant_id:'42',quantity:1}],calls=0;const merge=createBagMerger(()=>rows,id=>{rows=rows.filter(r=>r.variant_id!==id)});await Promise.all([merge(async()=>{calls++}),merge(async()=>{calls++})]);assert.equal(calls,1);assert.equal(rows.length,0);});
test('Failed guest imports retain uncommitted rows for review and retry',async()=>{let rows=[{variant_id:'42',quantity:1},{variant_id:'43',quantity:1}];const merge=createBagMerger(()=>rows,id=>{rows=rows.filter(r=>r.variant_id!==id)});await assert.rejects(merge(async id=>{if(id==='43')throw new Error('No stock')}),/No stock/);assert.deepEqual(rows.map(r=>r.variant_id),['43']);await merge(async()=>{});assert.equal(rows.length,0);});
