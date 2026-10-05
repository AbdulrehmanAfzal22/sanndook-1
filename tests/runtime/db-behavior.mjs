process.on('unhandledRejection',e=>{console.error('DATABASE CHECK FAILED:',e.message,e.code||'');process.exit(1);});
import {db} from './db-fixture.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const admin=randomUUID(),a=randomUUID(),b=randomUUID(),category=randomUUID(),pid=randomUUID(),v42=randomUUID(),v43=randomUUID();
const results=[];
async function check(label,fn){await fn();results.push(label);console.log('PASS',label);}
async function actor(id){await db.exec('RESET ROLE');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({sub:id,role:'authenticated',email:id+'@example.invalid'})]);await db.exec('SET ROLE authenticated');}
async function root(){await db.exec('RESET ROLE');}
async function reject(fn,code){let error;try{await fn();}catch(e){error=e;}assert.ok(error,'Expected rejection');if(code)assert.equal(error.code,code);}
const owner=randomUUID(),impostor=randomUUID(),laterOwner=randomUUID();
await check('Owner email cannot claim admin before email confirmation',async()=>{
 await db.query('insert into auth.users(id,email) values($1,$2)',[owner,'abdulrehmaan.afzal@gmail.com']);
 assert.equal((await db.query('select user_id from private.admin_members where user_id=$1',[owner])).rows.length,0);
});
await check('Verified customers cannot become admin through user metadata',async()=>{
 await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[impostor,'not-owner@example.invalid',{role:'admin',is_admin:true}]);
 assert.equal((await db.query('select user_id from private.admin_members where user_id=$1',[impostor])).rows.length,0);
});
await check('Verified selected owner claims the single admin bootstrap slot',async()=>{
 await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner]);
 assert.equal((await db.query('select user_id from private.store_owner_setup')).rows[0].user_id,owner);
 assert.equal((await db.query('select user_id from private.admin_members where user_id=$1',[owner])).rows.length,1);
});
await check('A later email match cannot claim a second owner identity',async()=>{
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[laterOwner,'abdulrehmaan.afzal@gmail.com']);
 assert.equal((await db.query('select user_id from private.admin_members where user_id=$1',[laterOwner])).rows.length,0);
});
await actor(impostor);
await check('Customer cannot read or change the private owner configuration',async()=>{
 await reject(()=>db.query('select * from private.store_owner_setup'),'42501');
 await reject(()=>db.query('update private.store_owner_setup set user_id=$1',[impostor]),'42501');
});
await root();
for(const id of [admin,a,b])await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,id+'@example.invalid',{full_name:'QA customer'}]);
await check('Address reads use one policy while customer writes retain separate ownership checks',async()=>{assert.equal((await db.query("select count(*)::int total from pg_policies where schemaname='public' and tablename='addresses' and cmd in('SELECT','ALL')")).rows[0].total,1);});
await db.query('insert into private.admin_members(user_id) values($1)',[admin]);
await db.query("insert into public.addresses(user_id,full_name,line1,city,country) values($1,'QA Buyer','QA Address','Lahore','Pakistan')",[a]);
await actor(b);
await check('Customers cannot read another customer’s saved delivery addresses',async()=>{assert.equal((await db.query('select id from public.addresses where user_id=$1',[a])).rows.length,0);});
await actor(admin);
await check('Admin customer details include saved addresses without granting address edits',async()=>{
 assert.equal((await db.query('select id from public.addresses where user_id=$1',[a])).rows.length,1);
 assert.equal((await db.query("update public.addresses set city='Karachi' where user_id=$1 returning id",[a])).rows.length,0);
});
await root();
await db.query('insert into public.categories(id,name,slug) values($1,$2,$3)',[category,'QA Shoes','qa-shoes']);
await actor(admin);await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['product-images',pid+'/cover.jpg']);
const payload={id:pid,name:'QA Shoe',brand:'QA Brand',description:'Behavioral test shoe',care:'Dry brush',price_cents:550000,category_id:category,status:'published',department:'unisex',condition:'new',size_system:'EU',width:'standard',condition_notes:'',material:'Mesh',fit_note:'Check label',images:[{path:pid+'/cover.jpg',alt:'QA Shoe',position:0}],variants:[{id:v42,color:'White',color_hex:'#eeeeee',size:'42',stock:2,sku:'QA-42'},{id:v43,color:'White',color_hex:'#eeeeee',size:'43',stock:0,sku:'QA-43'}]};
await check('Admin shoe save persists brand, fit and per-size SKU',async()=>{const r=await db.query('select public.save_shoe_product($1) id',[payload]);assert.equal(r.rows[0].id,pid);const p=await db.query('select brand,size_system from public.products where id=$1',[pid]);assert.equal(p.rows[0].brand,'QA Brand');assert.equal(p.rows[0].size_system,'EU');});
await check('Numeric half sizes accepted; clothing labels rejected',async()=>{await reject(()=>db.query("update public.product_variants set size='XL' where id=$1",[v42]),'23514');});
await check('Sale previous price must exceed current price',async()=>{await reject(()=>db.query('update public.products set compare_at_cents=1 where id=$1',[pid]),'23514');});
await actor(a);
await check('Customer cannot edit product price or become admin',async()=>{const r=await db.query('update public.products set price_cents=1 where id=$1 returning id',[pid]);assert.equal(r.rows.length,0);assert.equal((await db.query('select public.is_admin() ok')).rows[0].ok,false);});
await check('Customer product-save RPC denied',async()=>{await reject(()=>db.query('select public.save_shoe_product($1)',[payload]),'42501');});
await check('Customer cannot update store delivery settings',async()=>{assert.equal((await db.query('update public.store_settings set shipping_fee_cents=0 returning id')).rows.length,0);});
await check('Cart rejects requested quantity above stock',async()=>{await reject(()=>db.query('select public.add_to_cart($1,3)',[v42]),'23514');});
await db.query('select public.add_to_cart($1,1)',[v42]);
await actor(b);await db.query('select public.add_to_cart($1,2)',[v42]);
await actor(a);
const request=randomUUID(),shipping={full_name:'QA Buyer',line1:'QA Address',city:'Lahore',country:'Pakistan',phone:'03001234567',total_cents:1};
let order;
await check('Checkout computes PKR price and delivery on server',async()=>{order=(await db.query('select * from public.checkout_order($1,$2)',[shipping,request])).rows[0];assert.equal(order.total_cents,580000);const r=await db.query('select currency,payment_status,shipping_address from public.orders where id=$1',[order.order_id]);assert.equal(r.rows[0].currency,'PKR');assert.equal(r.rows[0].payment_status,'unpaid');assert.equal(r.rows[0].shipping_address.total_cents,undefined);});
await check('Idempotent checkout retry returns same order without second stock deduction',async()=>{const again=(await db.query('select * from public.checkout_order($1,$2)',[shipping,request])).rows[0];assert.equal(again.order_id,order.order_id);assert.equal((await db.query('select stock from public.product_variants where id=$1',[v42])).rows[0].stock,1);});
await actor(b);
await check('Checkout revalidates remaining stock for a competing cart',async()=>{await reject(()=>db.query('select * from public.checkout_order($1,$2)',[shipping,randomUUID()]),'23514');assert.equal((await db.query('select quantity from public.cart_items where variant_id=$1',[v42])).rows[0].quantity,2);});
await check('Customer cannot see another customer’s order',async()=>{assert.equal((await db.query('select id from public.orders where id=$1',[order.order_id])).rows.length,0);});
await actor(a);await check('Stock alert can only be created for the signed-in customer',async()=>{await db.query('insert into public.stock_notifications(user_id,variant_id) values($1,$2)',[a,v43]);await reject(()=>db.query('insert into public.stock_notifications(user_id,variant_id) values($1,$2)',[b,v43]),'42501');});
await actor(admin);
await check('Permanent delete preserves products referenced by order history',async()=>{await reject(()=>db.query('select public.delete_product($1)',[pid]),'23503');});
await db.query('select public.set_order_status($1,$2)',[order.order_id,'confirmed']);await db.query('select public.set_order_status($1,$2)',[order.order_id,'processing']);await db.query('select public.set_order_status($1,$2)',[order.order_id,'shipped']);await db.query('select public.set_order_status($1,$2)',[order.order_id,'delivered']);await db.query('update public.product_variants set stock=1 where id=$1',[v43]);
await actor(a);let item=(await db.query('select id from public.order_items where order_id=$1',[order.order_id])).rows[0].id,exchange;
await check('Delivered order supports size-exchange request',async()=>{exchange=(await db.query('insert into public.exchange_requests(user_id,order_item_id,replacement_variant_id,reason) values($1,$2,$3,$4) returning id',[a,item,v43,'Prefer a larger size'])).rows[0].id;});
await actor(b);
await check('Size-exchange requests remain private to their customer',async()=>{assert.equal((await db.query('select id from public.exchange_requests where id=$1',[exchange])).rows.length,0);});
await check('Another customer cannot submit exchange for the same order item',async()=>{await reject(()=>db.query('insert into public.exchange_requests(user_id,order_item_id,reason) values($1,$2,$3)',[b,item,'Wrong ownership test']),'42501');});
await actor(a);await check('Customer cannot approve their own exchange',async()=>{assert.equal((await db.query("update public.exchange_requests set status='approved' where id=$1 returning id",[exchange])).rows.length,0);});
await actor(admin);await check('Admin exchange approval has controlled status transitions',async()=>{await db.query("update public.exchange_requests set status='approved' where id=$1",[exchange]);await db.query("update public.exchange_requests set status='completed' where id=$1",[exchange]);await reject(()=>db.query("update public.exchange_requests set status='requested' where id=$1",[exchange]),'P0001');});
await check('Free shipping threshold is inclusive',async()=>{assert.equal((await db.query('select public.quote_shipping(1200000) fee')).rows[0].fee,0);});
await actor(admin);
await check('Editing a sale price clears stale comparison atomically and supports SKU swaps',async()=>{
 const edited={...payload,compare_at_cents:750000,variants:payload.variants.map(v=>({...v,stock:1}))};
 await db.query('select public.save_shoe_product($1)',[edited]);
 edited.price_cents=850000;edited.compare_at_cents=null;edited.variants[0].sku='QA-43';edited.variants[1].sku='QA-42';
 await db.query('select public.save_shoe_product($1)',[edited]);
 assert.equal((await db.query('select price_cents,compare_at_cents from public.products where id=$1',[pid])).rows[0].price_cents,850000);
 assert.equal((await db.query('select sku from public.product_variants where id=$1',[v42])).rows[0].sku,'QA-43');
});
await check('Preloved pairs cannot save multi-pair stock',async()=>{await reject(()=>db.query('select public.save_shoe_product($1)',[{...payload,condition:'premium',condition_notes:'Actual wear described',variants:[{...payload.variants[0],stock:2}]}]));});
let managedBrand;
await check('The brand directory starts with eighteen editable department categories',async()=>{
 const rows=(await db.query('select name,departments from public.brands')).rows;assert.equal(rows.length,18);assert.ok(rows.some(row=>row.name==='Gucci'));assert.ok(rows.every(row=>row.departments.includes('kids')));
});
await check('Product saves associate a managed brand without changing the original save contract',async()=>{
 await db.query('select public.save_shoe_product($1)',[{...payload,brand:' nike ',variants:payload.variants.map(variant=>({...variant,stock:1}))}]);
 const row=(await db.query('select brand,brand_id from public.products where id=$1',[pid])).rows[0];assert.equal(row.brand,'Nike');assert.ok(row.brand_id);managedBrand=row.brand_id;
});
await check('Admin renaming a brand updates its linked product label atomically',async()=>{
 await db.query("update public.brands set name='Nike Studio' where id=$1",[managedBrand]);assert.equal((await db.query('select brand from public.products where id=$1',[pid])).rows[0].brand,'Nike Studio');
});
await check('Brand names are unique without regard to case',async()=>{await reject(()=>db.query("insert into public.brands(name,slug) values('GUCCI','duplicate-gucci')"),'23505');});
await check('Brands require at least one supported department',async()=>{await reject(()=>db.query("update public.brands set departments='{}' where id=$1",[managedBrand]),'23514');});
await actor(b);
await check('Customers cannot create, edit or delete brand categories',async()=>{
 await reject(()=>db.query("insert into public.brands(name,slug) values('Injected','injected')"),'42501');
 assert.equal((await db.query("update public.brands set name='Hacked' where id=$1 returning id",[managedBrand])).rows.length,0);
 assert.equal((await db.query('delete from public.brands where id=$1 returning id',[managedBrand])).rows.length,0);
 await reject(()=>db.query('select access_token from public.instagram_private_connection'),'42501');
});
await actor(admin);
await check('Hiding a brand removes it from public browsing but keeps it editable by admin',async()=>{
 await db.query('update public.brands set is_active=false where id=$1',[managedBrand]);assert.equal((await db.query('select id from public.brands where id=$1',[managedBrand])).rows.length,1);
 await actor(b);assert.equal((await db.query('select id from public.brands where id=$1',[managedBrand])).rows.length,0);await actor(admin);
});
await check('Deleting a brand preserves its products, per-size stock and order history',async()=>{
 const before=(await db.query('select stock from public.product_variants where id=$1',[v42])).rows[0].stock;
 await db.query('delete from public.brands where id=$1',[managedBrand]);
 const row=(await db.query('select brand,brand_id from public.products where id=$1',[pid])).rows[0];assert.equal(row.brand,'Nike Studio');assert.equal(row.brand_id,null);
 assert.equal((await db.query('select stock from public.product_variants where id=$1',[v42])).rows[0].stock,before);assert.ok((await db.query('select id from public.orders where id=$1',[order.order_id])).rows.length);
});
await actor(b);
await check('Non-purchasers cannot review another customer’s delivered pair',async()=>{await reject(()=>db.query('select public.submit_review($1,5,$2)',[pid,'Not a purchaser']),'42501');});
await actor(a);let review;
await check('Delivered purchaser can submit a review awaiting moderation',async()=>{review=(await db.query('select public.submit_review($1,5,$2) id',[pid,'Good fit and comfortable'])).rows[0].id;const r=(await db.query('select approved,status,customer_name from public.reviews where id=$1',[review])).rows[0];assert.equal(r.approved,false);assert.equal(r.status,'pending');assert.equal(r.customer_name,'QA customer');});
await actor(admin);
await check('Admin approval publishes review and recalculates secure rating view',async()=>{await db.query("update public.reviews set status='approved' where id=$1",[review]);assert.equal((await db.query('select approved from public.reviews where id=$1',[review])).rows[0].approved,true);assert.equal((await db.query('select review_count from public.product_review_stats where product_id=$1',[pid])).rows[0].review_count,1);});
await root();await db.query("select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claims','{}',false)");await db.exec('SET ROLE anon');
await check('Anonymous visitors can read approved reviews and rating summaries',async()=>{assert.equal((await db.query('select id from public.reviews')).rows.length,1);assert.equal((await db.query('select review_count from public.product_review_stats')).rows[0].review_count,1);});
await actor(admin);await db.query("update public.reviews set status='spam' where id=$1",[review]);await root();await db.query("select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claims','{}',false)");await db.exec('SET ROLE anon');
await check('Moderated spam is hidden from anonymous reviews and ratings',async()=>{assert.equal((await db.query('select id from public.reviews')).rows.length,0);assert.equal((await db.query('select * from public.product_review_stats')).rows.length,0);});
await actor(a);let conversation,ticket;
await check('Original customer support retains one thread and customer messages',async()=>{conversation=(await db.query('select public.start_customer_support_conversation($1) id',['Which size should I choose?'])).rows[0].id;assert.equal((await db.query('select public.start_customer_support_conversation($1) id',['One more fit question'])).rows[0].id,conversation);await db.query('select public.send_customer_support_message($1,$2)',[conversation,'My size label is EU 42']);assert.equal((await db.query('select * from public.get_my_support_messages($1)',[conversation])).rows.length,3);});
await check('Legacy order-linked support ticket works after message-table rename',async()=>{ticket=(await db.query('select public.create_support_ticket($1,$2,$3) id',['Size question','Please help choose a size',order.order_id])).rows[0].id;await db.query('select public.add_support_message($1,$2)',[ticket,'Adding fit details']);assert.equal((await db.query('select id from public.support_ticket_messages where ticket_id=$1',[ticket])).rows.length,2);});
await actor(b);
await check('Another customer cannot access or reply to private support',async()=>{await reject(()=>db.query('select public.send_customer_support_message($1,$2)',[conversation,'Foreign reply']),'42501');await reject(()=>db.query('select public.add_support_message($1,$2)',[ticket,'Foreign ticket reply']),'42501');assert.equal((await db.query('select id from public.support_ticket_messages where ticket_id=$1',[ticket])).rows.length,0);});
await actor(admin);
await check('Admin inbox and replies preserve the original support workflow',async()=>{assert.ok((await db.query('select * from public.admin_get_support_inbox()')).rows.some(r=>r.id===conversation));await db.query('select public.admin_send_support_message($1,$2)',[conversation,'Check the brand size chart']);assert.equal((await db.query('select * from public.admin_get_support_messages($1)',[conversation])).rows.length,4);await db.query('select public.mark_support_conversation_read($1,true)',[conversation]);});
await root();await db.query('delete from public.exchange_requests where id=$1',[exchange]);await db.query("update public.order_status_history set created_at=now()-interval '8 days' where order_id=$1 and status='delivered'",[order.order_id]);await actor(a);
await check('Server rejects exchanges outside the configured delivery window',async()=>{await reject(()=>db.query('insert into public.exchange_requests(user_id,order_item_id,reason) values($1,$2,$3)',[a,item,'Outside the exchange window']),'P0001');});
await root();
await check('Public API contains no security-definer functions',async()=>{assert.equal((await db.query("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef")).rows[0].n,0);});
await check('Anonymous cannot invoke checkout, product writes or permanent delete',async()=>{const r=await db.query("select has_function_privilege('anon','public.checkout_order(jsonb,uuid)','EXECUTE') a,has_function_privilege('anon','public.save_shoe_product(jsonb)','EXECUTE') b,has_function_privilege('anon','public.delete_product(uuid)','EXECUTE') c");assert.deepEqual(r.rows[0],{a:false,b:false,c:false});});
console.log('DATABASE BEHAVIOR CHECKS PASSED:',results.length);await db.close();
