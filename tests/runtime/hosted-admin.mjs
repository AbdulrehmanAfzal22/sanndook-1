// Opt-in hosted integration run. Temporary Auth identities are provisioned
// through the management connector, and credentials arrive only over stdin.
// The script never edits real users, the owner slot or a real customer's order.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
mkdirSync('.qa',{recursive:true});
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('READY FOR ISOLATED QA CREDENTIALS\n');
const line=await new Promise(resolve=>{let buffer='';function input(chunk){buffer+=chunk;if(buffer.includes('\n')){process.stdin.off('data',input);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(buffer.split('\n')[0]);}}process.stdin.on('data',input);});
const fixture=JSON.parse(line);
for(const field of ['run','admin','customer','other','product','v42','v43','category'])assert.match(fixture[field],/^[0-9a-f-]{36}$/);
const sessionStorage=new Map();globalThis.window={location:{pathname:'/admin',search:'?catalog=live',hash:''},sessionStorage:{getItem:key=>sessionStorage.get(key),setItem:(key,value)=>sessionStorage.set(key,value)},dispatchEvent(){}};
globalThis.BroadcastChannel=undefined;
await build({entryPoints:['tests/runtime/hosted-admin-entry.js'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/hosted-admin.cjs',loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({VITE_STORE_PREVIEW:'false'})}});
const require=createRequire(import.meta.url),s=require('../../.qa/hosted-admin.cjs'),checks=[];
const report={project:'shoe',projectId:'ipqcxqsjzkbtxpljvdcy',startedAt:new Date().toISOString(),kind:'actual frontend services against hosted Auth, REST, RPC and Storage',checks};
async function check(label,fn){await fn();checks.push(label);console.log('PASS',label);}
async function rejects(fn,pattern){let error;try{await fn();}catch(e){error=e;}assert.ok(error,'Expected server/service rejection');if(pattern)assert.match(error.message,pattern);}
async function login(role){s.supabase.auth.stopAutoRefresh();const result=await s.supabase.auth.signInWithPassword({email:`qa-${role}-${fixture.run}@example.invalid`,password:fixture.password});if(result.error)throw result.error;assert.equal(result.data.user.id,fixture[role]);await s.ensureCustomerProfile();}
const png=new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')],{type:'image/png'});
let brand,categoryPhoto,product,order,review,conversation,address,exchange;
const payload={id:fixture.product,name:`Temporary QA runner ${fixture.run}`,description:'Temporary integration-test shoe; removed after verification.',care:'Dry brush',price_cents:550000,category_id:fixture.category,status:'draft',featured:false,department:'men',brand:`QA brand ${fixture.run}`,condition:'new',size_system:'EU',width:'standard',material:'Mesh',fit_note:'Numeric EU sizes',condition_notes:'',images:[],variants:[{id:fixture.v42,color:'White',color_hex:'#ffffff',size:'42',stock:4,sku:`QA42-${fixture.run}`},{id:fixture.v43,color:'White',color_hex:'#ffffff',size:'43',stock:0,sku:`QA43-${fixture.run}`}]};
try{
 await login('admin');
 await check('Live GoTrue login resolves a verified administrator',async()=>assert.equal(await s.checkAdminAccess(fixture.admin),true));
 await check('Admin category create, photo upload and metadata update persist',async()=>{
  await s.createCategory({id:fixture.category,name:`QA shoes ${fixture.run}`,slug:`qa-${fixture.run}`,description:'Temporary QA collection'});
  categoryPhoto=await s.uploadCategoryImage(png,fixture.category);await s.updateCategory(fixture.category,{image_path:categoryPhoto,image_alt:'QA shoe',display_order:99});
  const category=(await s.getCategories()).find(category=>category.id===fixture.category);assert.equal(category.image_path,categoryPhoto);
 });
 await check('Admin creates a brand restricted to selected departments',async()=>{brand=await s.saveBrand({name:payload.brand,departments:['men','women'],is_active:true});assert.deepEqual(brand.departments,['men','women']);});
 await check('Shoe save uploads a photo and stores a draft with independent size stock',async()=>{
  assert.equal(await s.saveProduct(payload,[{file:png,color:'White'}]),fixture.product);product=await s.getProduct(fixture.product);assert.equal(product.price_cents,550000);assert.equal(product.status,'draft');assert.equal(product.product_images.length,1);assert.equal(product.product_variants.find(v=>v.id===fixture.v43).stock,0);
 });
 await check('Publishing a complete shoe updates the real catalog',async()=>{payload.status='published';await s.saveProduct(payload,[]);assert.equal((await s.getProducts()).find(p=>p.id===fixture.product).status,'published');});
 await check('Product photography is publicly readable after storage upload',async()=>{const url=s.supabase.storage.from('product-images').getPublicUrl(product.product_images[0].path).data.publicUrl;const r=await fetch(url);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>0);});
 await check('Brand rename updates linked shoe labels atomically',async()=>{brand=await s.saveBrand({...brand,name:`QA renamed ${fixture.run}`});product=await s.getProduct(fixture.product);assert.equal(product.brand,brand.name);});
 await check('Stock updates persist and reject a stale page instead of overwriting',async()=>{const variant=(await s.getInventory()).find(v=>v.id===fixture.v42);await s.updateStock(variant.id,6,variant.updated_at);await rejects(()=>s.updateStock(variant.id,2,variant.updated_at),/Stock changed/);});
 await check('Delivery settings are readable and accept an unchanged admin save',async()=>{const settings=await s.getStoreSettings();const saved=await s.updateStoreSettings({shipping_fee_cents:settings.shipping_fee_cents,free_shipping_threshold_cents:settings.free_shipping_threshold_cents,exchange_window_days:settings.exchange_window_days});assert.equal(saved.shipping_fee_cents,settings.shipping_fee_cents);});
 await login('customer');
 await check('Customer login does not grant administrator access',async()=>assert.equal(await s.checkAdminAccess(fixture.customer),false));
 await check('Customer profile changes persist',async()=>{await s.updateProfile(fixture.customer,{full_name:'Temporary QA Shoe Buyer'});assert.equal((await s.getProfile(fixture.customer)).full_name,'Temporary QA Shoe Buyer');});
 await check('Delivery address create and edit save on the signed-in customer',async()=>{address=await s.addAddress({user_id:fixture.customer,label:'QA',full_name:'Temporary QA Shoe Buyer',line1:'Temporary test address',city:'Lahore',country:'Pakistan',phone:'03001234567'});await s.updateAddress(address.id,fixture.customer,{city:'Karachi'});assert.equal((await s.getAddresses(fixture.customer))[0].city,'Karachi');});
 await check('Size stock subscriptions persist for the customer',async()=>{await s.subscribeToStock(fixture.customer,fixture.v43);assert.ok((await s.getStockAlerts(fixture.customer)).some(alert=>alert.variant_id===fixture.v43));});
 await check('Cart and checkout use the chosen size and server-calculated PKR total',async()=>{await s.addToCart(fixture.v42,1);assert.equal((await s.getCart(fixture.customer))[0].variant_id,fixture.v42);order=await s.placeOrder({full_name:'Temporary QA Shoe Buyer',line1:'Temporary test address',city:'Lahore',country:'Pakistan',phone:'03001234567',total_cents:1},randomUUID());const saved=await s.getOrderById(order.order_id,fixture.customer);assert.equal(saved.currency,'PKR');assert.equal(saved.order_items[0].size,'42');assert.equal(saved.subtotal_cents,550000);assert.ok(saved.total_cents>=550000);});
 await check('Customer support creates and reuses its authenticated conversation',async()=>{conversation=await s.startCustomerSupportConversation('Temporary QA: please help with size 42.');const again=await s.startCustomerSupportConversation('Temporary QA: same conversation.');assert.equal(again,conversation);assert.ok((await s.getSupportMessages(conversation)).length>=2);});
 await login('other');
 await check('Forged admin metadata cannot grant access on the real backend',async()=>assert.equal(await s.checkAdminAccess(fixture.other),false));
 await check('Other customers cannot read addresses, orders or conversations',async()=>{assert.equal((await s.getAddresses(fixture.customer)).length,0);assert.equal((await s.getCustomerOrders(fixture.customer)).length,0);await rejects(()=>s.getSupportMessages(conversation));});
 await check('Customers cannot save products or moderate another customer’s order',async()=>{await rejects(()=>s.saveProduct({...payload,brand:brand.name},[]));await rejects(()=>s.updateOrderStatus(order.order_id,'delivered'));});
 await login('admin');
 await check('Admin customers and order details merge real profiles and addresses',async()=>{const customer=await s.getCustomerById(fixture.customer);assert.equal(customer.addresses[0].city,'Karachi');assert.equal(customer.orders[0].id,order.order_id);assert.ok((await s.getCustomers()).find(p=>p.id===fixture.customer).orders.length===1);assert.equal((await s.getAdminOrders()).find(o=>o.id===order.order_id).customer.full_name,'Temporary QA Shoe Buyer');});
 await check('Fulfillment, payment and immutable order history persist',async()=>{await s.updateOrderStatus(order.order_id,'confirmed');await s.updateOrderStatus(order.order_id,'shipped');await s.updateOrderStatus(order.order_id,'delivered');await s.updatePaymentStatus(order.order_id,'paid');const saved=(await s.getAdminOrders()).find(o=>o.id===order.order_id);assert.equal(saved.payment_status,'paid');assert.equal(saved.status,'delivered');assert.ok(saved.order_status_history.some(h=>h.status==='delivered'));});
 await check('Paid analytics joins variant IDs to shoes and collections',async()=>{const data=await s.getAnalytics();assert.ok(data.topProducts.some(p=>p.label===payload.name&&p.value===550000));assert.ok(data.categoryRevenue.some(p=>p.label===`QA shoes ${fixture.run}`&&p.value===550000));assert.ok(data.revenueCents>=order.total_cents);const dashboard=await s.getDashboardMetrics();assert.ok(dashboard.outOfStock>=1&&dashboard.lowStock>=1);});
 await check('Order-linked shoes cannot be permanently deleted',async()=>await rejects(()=>s.deleteProduct(fixture.product),/order history/));
 await check('Admin support inbox and reply are visible to the right customer',async()=>{assert.ok((await s.getSupportInbox()).some(row=>row.id===conversation||row.conversation_id===conversation));await s.sendSupportMessage('Temporary QA: your size is available.',conversation,true);});
 await check('Admin can restock a different shoe size for the requested exchange',async()=>{const size=(await s.getInventory()).find(v=>v.id===fixture.v43);await s.updateStock(size.id,2,size.updated_at);assert.equal((await s.getInventory()).find(v=>v.id===fixture.v43).stock,2);});
 await login('customer');
 await check('Delivered customer can submit a pending shoe review',async()=>{review=await s.addReview({product_id:fixture.product,user_id:fixture.customer,rating:5,comment:'Temporary QA verification review.'});assert.equal(review.status,'pending');});
 await check('Customer sees the admin support reply in the same thread',async()=>assert.ok((await s.getSupportMessages(conversation)).some(message=>message.message?.includes('size is available')||message.body?.includes('size is available'))));
 await check('Delivered shoe supports a valid different-size exchange request',async()=>{const saved=await s.getOrderById(order.order_id,fixture.customer);exchange=await s.requestExchange({userId:fixture.customer,orderItemId:saved.order_items[0].id,replacementVariantId:fixture.v43,reason:'Temporary QA fit request'});assert.equal(exchange.status,'requested');});
 await login('admin');
 await check('Admin exchange review and completion persist controlled status changes',async()=>{await s.updateExchange(exchange.id,{status:'approved'});await s.updateExchange(exchange.id,{status:'completed'});assert.equal((await s.getExchangeRequests(true)).find(row=>row.id===exchange.id).status,'completed');});
 await check('Approval publishes the review to the real product',async()=>{await s.setReviewStatus(review.id,'approved');assert.ok((await s.getProductReviews(fixture.product)).some(r=>r.id===review.id));});
 await check('Review rejection survives a fresh database read and hides public feedback',async()=>{await s.approveReview(review.id,false);assert.equal((await s.getAdminReviews()).find(r=>r.id===review.id).status,'rejected');assert.equal((await s.getProductReviews(fixture.product)).length,0);});
 await check('Spam status persists and deletion removes only the QA review',async()=>{await s.setReviewStatus(review.id,'spam');assert.equal((await s.getAdminReviews()).find(r=>r.id===review.id).status,'spam');await s.deleteReview(review.id);assert.ok(!(await s.getAdminReviews()).some(r=>r.id===review.id));});
 await check('Refunded payment records are excluded from paid product analytics',async()=>{await s.updatePaymentStatus(order.order_id,'refunded');assert.ok(!(await s.getAnalytics()).topProducts.some(p=>p.label===payload.name));});
 await check('Archiving hides the test shoe while preserving its order snapshot',async()=>{await s.archiveProduct(fixture.product);assert.ok(!(await s.getProducts()).some(p=>p.id===fixture.product));assert.equal((await s.getAdminOrders()).find(o=>o.id===order.order_id).order_items[0].product_name,payload.name);});
 await check('Brand deletion preserves the shoe and ordered sizes',async()=>{await s.deleteBrand(brand.id);assert.ok(await s.getProduct(fixture.product));});
 await login('customer');await s.removeStockAlert(fixture.customer,fixture.v43);await s.removeAddress(address.id);
 await check('Customer address and stock-subscription deletion persist',async()=>{assert.equal((await s.getAddresses(fixture.customer)).length,0);assert.equal((await s.getStockAlerts(fixture.customer)).length,0);});
 report.completedAt=new Date().toISOString();report.status='passed';
}catch(error){report.completedAt=new Date().toISOString();report.status='failed';report.error=error.message;console.error('HOSTED ADMIN CHECK FAILED:',error.message,error.code||'');process.exitCode=1;}
finally{
 if(categoryPhoto)await s.removeCategoryImage(categoryPhoto).catch(()=>{});
 await s.supabase.auth.signOut();s.supabase.auth.stopAutoRefresh();
 writeFileSync('docs/ADMIN_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');
 console.log('HOSTED ADMIN CHECKS:',report.status,checks.length);
 console.log('Management-connector cleanup must remove exactly this run’s fixture IDs.');
}
