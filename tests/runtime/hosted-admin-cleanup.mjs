// Continue the opt-in hosted run with the final address policies, different-size
// exchanges and scoped cleanup. All credentials and handoffs arrive over stdin.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
async function input(){
 if(process.stdin.isTTY)process.stdin.setRawMode(true);
 return new Promise(resolve=>{let buffer='';const listener=chunk=>{buffer+=chunk;if(buffer.includes('\n')){process.stdin.off('data',listener);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(JSON.parse(buffer.split('\n')[0]));}};process.stdin.resume();process.stdin.on('data',listener);});
}
console.log('READY FOR ISOLATED QA CREDENTIALS');const fixture=await input();
globalThis.window={location:{pathname:'/admin',search:'?catalog=live',hash:''},sessionStorage:{getItem(){return null;},setItem(){}},dispatchEvent(){}};globalThis.BroadcastChannel=undefined;
await build({entryPoints:['tests/runtime/hosted-admin-entry.js'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/hosted-admin-cleanup.cjs',define:{'import.meta.env':JSON.stringify({VITE_STORE_PREVIEW:'false'})}});
const s=createRequire(import.meta.url)('../../.qa/hosted-admin-cleanup.cjs'),report=JSON.parse(readFileSync('docs/ADMIN_VERIFICATION.json','utf8'));
async function login(role){const {error}=await s.supabase.auth.signInWithPassword({email:`qa-${role}-${fixture.run}@example.invalid`,password:fixture.password});if(error)throw error;s.supabase.auth.stopAutoRefresh();}
async function check(label,fn){await fn();report.checks.push(label);console.log('PASS',label);}
async function reject(fn){let rejected=false;try{await fn();}catch{rejected=true;}assert.ok(rejected);}
try{
 await login('customer');let address;
 await check('Final address policies let a customer create and edit their own address',async()=>{address=await s.addAddress({user_id:fixture.customer,full_name:'Temporary QA Buyer',line1:'Temporary address',city:'Lahore',country:'Pakistan'});await s.updateAddress(address.id,fixture.customer,{city:'Karachi'});assert.equal((await s.getAddresses(fixture.customer)).find(a=>a.id===address.id).city,'Karachi');});
 await login('other');await check('Final address policies keep other customer addresses private',async()=>{assert.equal((await s.getAddresses(fixture.customer)).length,0);await reject(()=>s.updateAddress(address.id,fixture.customer,{city:'Wrong customer'}));});
 await login('admin');
 await check('Final admin address access is read-only, including delivery detail views',async()=>{const buyer=await s.getCustomerById(fixture.customer);assert.equal(buyer.addresses[0].city,'Karachi');await reject(()=>s.updateAddress(address.id,fixture.customer,{city:'Admin overwrite'}));assert.equal((await s.getAddresses(fixture.customer))[0].city,'Karachi');});
 await check('Admin can restock a different shoe size for the requested exchange',async()=>{const variant=(await s.getInventory()).find(v=>v.id===fixture.v43);await s.updateStock(variant.id,2,variant.updated_at);assert.equal((await s.getInventory()).find(v=>v.id===fixture.v43).stock,2);const pair=await s.getProduct(fixture.product);await s.saveProduct({...pair,status:'published',images:pair.product_images,variants:pair.product_variants.filter(v=>v.active)},[]);});
 await login('customer');let exchange;
 await check('Delivered shoe supports a valid different-size exchange request',async()=>{const order=(await s.getCustomerOrders(fixture.customer))[0];exchange=await s.requestExchange({userId:fixture.customer,orderItemId:order.order_items[0].id,replacementVariantId:fixture.v43,reason:'Temporary QA: request EU 43 instead of EU 42'});assert.equal(exchange.status,'requested');});
 await login('admin');await check('Admin exchange review and completion persist controlled status changes',async()=>{await s.updateExchange(exchange.id,{status:'approved'});await s.updateExchange(exchange.id,{status:'completed'});assert.equal((await s.getExchangeRequests(true)).find(row=>row.id===exchange.id).status,'completed');});
 console.log('READY FOR EXACT QA ORDER CLEANUP');assert.equal((await input()).ordersRemoved,true);
 await check('Deleting an unreferenced shoe removes its catalog data and uploaded images',async()=>{const removed=await s.deleteProduct(fixture.product);assert.equal(removed.storageCleanupError,null);assert.equal(await s.getProduct(fixture.product),null);const {data,error}=await s.supabase.storage.from('product-images').list(fixture.product);if(error)throw error;assert.equal(data.length,0);});
 await check('Category photo removal and collection deletion clean only the QA category',async()=>{const category=(await s.getCategories()).find(c=>c.id===fixture.category);await s.removeCategoryImage(category.image_path);await s.deleteCategory(fixture.category);assert.ok(!(await s.getCategories()).some(c=>c.id===fixture.category));const {data,error}=await s.supabase.storage.from('category-images').list(fixture.category);if(error)throw error;assert.equal(data.length,0);});
 report.completedAt=new Date().toISOString();report.status='passed';
}catch(error){report.status='failed';report.error=error.message;process.exitCode=1;console.error('HOSTED FOLLOWUP FAILED:',error.message,error.code||'');}
finally{await s.supabase.auth.signOut();s.supabase.auth.stopAutoRefresh();writeFileSync('docs/ADMIN_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');console.log('HOSTED ADMIN CHECKS:',report.status,report.checks.length);}
