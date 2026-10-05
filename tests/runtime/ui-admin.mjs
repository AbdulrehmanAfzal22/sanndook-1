// Real protected routes and real frontend services; HTTP is isolated in this
// process. The hosted-service suite separately verifies server permissions.
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
mkdirSync('.qa',{recursive:true});
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',{url:'http://qa.local/admin?catalog=live',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','location','HTMLElement','Element','Node','Event','MouseEvent','CustomEvent','FormData'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.BroadcastChannel=undefined;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.confirm=()=>true;window.scrollTo=()=>{};
const ADMIN='fa000000-0000-4000-8000-000000000001',CUSTOMER='fa000000-0000-4000-8000-000000000002';
const fixtureToken=id=>[{alg:'HS256',typ:'JWT'},{sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(value=>typeof value==='string'?value:Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
let userId=ADMIN,requests=[],addresses=[],savedProduct=null;
let profiles=[{id:ADMIN,full_name:'Store Owner',email:'owner@example.invalid'},{id:CUSTOMER,full_name:'Shoe Buyer',email:'buyer@example.invalid'}];
let variants=[{id:'variant42',product_id:'pair1',stock:3,size:'42',color:'White',active:true,updated_at:'2026-10-05T01:00:00Z',products:{name:'Orbit runner'}}];
const product={id:'pair1',name:'Orbit runner',description:'Comfortable shoe',price_cents:500000,status:'published',category_id:'sneakers',department:'men',brand:'Nike',condition:'new',size_system:'EU',width:'standard',product_images:[{path:'pair1/cover.png',position:0}],product_variants:variants,categories:{name:'Sneakers'}};
let reviews=[{id:'review1',product_id:'pair1',user_id:CUSTOMER,rating:4,comment:'Comfortable in my size',status:'pending',approved:false,created_at:'2026-10-05T03:00:00Z',products:{name:'Orbit runner'}}];
let orders=[{id:'order1',user_id:CUSTOMER,order_number:1001,total_cents:530000,payment_status:'paid',status:'pending',created_at:'2026-10-05T02:00:00Z',shipping_address:{full_name:'Shoe Buyer',line1:'Test Street',city:'Lahore',country:'Pakistan'},order_items:[{id:'item1',variant_id:'variant42',product_name:'Orbit runner',unit_price_cents:500000,quantity:1,size:'42',color:'White'}],order_status_history:[]}];
const settings={id:true,shipping_fee_cents:30000,free_shipping_threshold_cents:1200000,exchange_window_days:7};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input.url),method=init?.method||'GET',body=init?.body?JSON.parse(init.body):null,headers=new Headers(init?.headers||input?.headers);
 assert.equal(url.hostname,'ipqcxqsjzkbtxpljvdcy.supabase.co');requests.push({path:url.pathname,method,body});
 const id=url.searchParams.get('id')?.replace(/^eq\./,'');let data;
 if(url.pathname==='/auth/v1/user')data={id:userId,aud:'authenticated',role:'authenticated',email:profiles.find(profile=>profile.id===userId).email,user_metadata:{role:'admin',is_admin:true}};
 else if(url.pathname==='/auth/v1/token')data={access_token:fixtureToken(userId),token_type:'bearer',expires_in:3600,refresh_token:'isolated-refresh',user:{id:userId,aud:'authenticated',role:'authenticated',email:profiles.find(profile=>profile.id===userId).email}};
 else if(url.pathname==='/auth/v1/logout')data={};
 else if(url.pathname==='/rest/v1/rpc/ensure_customer_profile')data=userId;
 else if(url.pathname==='/rest/v1/rpc/is_admin')data=userId===ADMIN;
 else if(url.pathname==='/rest/v1/rpc/set_order_status'){orders[0].status=body.p_status;data=null;}
 else if(url.pathname==='/rest/v1/rpc/set_payment_status'){orders[0].payment_status=body.p_status;data=null;}
 else if(url.pathname==='/rest/v1/rpc/save_shoe_product'){savedProduct=body.payload;data=body.payload.id;}
 else if(url.pathname==='/rest/v1/rpc/delete_product')data={product_id:body.p_product_id,image_paths:[]};
 else if(url.pathname.includes('/storage/v1/object/list/'))data=[];
 else if(url.pathname==='/rest/v1/rpc/admin_get_support_inbox')data=[];
 else if(url.pathname==='/rest/v1/brands')data=[];
 else if(url.pathname==='/rest/v1/products')data=[product];
 else if(url.pathname==='/rest/v1/categories')data=[{id:'sneakers',name:'Sneakers',slug:'sneakers',is_active:true,is_accessory:false}];
 else if(url.pathname==='/rest/v1/orders')data=orders;
 else if(url.pathname==='/rest/v1/product_variants'){
  if(method==='PATCH'){variants[0].stock=body.stock;variants[0].updated_at='2026-10-05T02:00:00Z';data=variants[0];}else data=variants;
 }
 else if(url.pathname==='/rest/v1/reviews'){
  if(method==='PATCH'){Object.assign(reviews[0],body,{approved:body.status==='approved'});data=reviews[0];}else if(method==='DELETE'){reviews=[];data=null;}else data=reviews;
 }
 else if(url.pathname==='/rest/v1/profiles'){
  const profile=profiles.find(profile=>profile.id===(id||userId));
  if(method==='PATCH'){Object.assign(profile,body);data=profile;}else data=headers.get('accept')?.includes('object+json')?profile:profiles;
 }
 else if(url.pathname==='/rest/v1/addresses'){
  if(method==='POST'){data={id:'address1',...body};addresses.push(data);}
  else if(method==='PATCH'){data=addresses.find(address=>address.id===id);Object.assign(data,body);}
  else if(method==='DELETE'){addresses=addresses.filter(address=>address.id!==id);data=null;}
  else data=addresses;
 }
 else if(url.pathname==='/rest/v1/store_settings'){if(method==='PATCH')Object.assign(settings,body);data=settings;}
 else if(['/rest/v1/cart_items','/rest/v1/stock_notifications','/rest/v1/exchange_requests','/rest/v1/instagram_reels'].includes(url.pathname))data=[];
 else if(url.pathname==='/functions/v1/instagram-feed')data={connected:false,items:[],settings:{is_enabled:false},meta_configured:false};
 else throw new Error('Unexpected admin endpoint: '+url.pathname);
 if(method==='HEAD')return new Response(null,{headers:{'Content-Range':`0-0/${data?.length||0}`}});
 if(Array.isArray(data)&&headers.get('accept')?.includes('object+json'))data=data[0]||null;
 return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
};
await build({entryPoints:['tests/runtime/ui-entry.jsx'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/ui-admin.cjs',external:['react','react-dom','react-dom/client','react-router-dom'],loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({VITE_STORE_PREVIEW:'false'})},jsx:'automatic'});
const require=createRequire(import.meta.url),React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{TestApp,supabase}=require('../../.qa/ui-admin.cjs');
const root=createRoot(document.getElementById('root'));let count=0,renderId=0;
// Use the compiled stylesheet to catch legacy CSS overriding the final theme.
const productionCSS=readdirSync('dist/assets').find(name=>/^index-.*\.css$/.test(name));
assert.ok(productionCSS,'Build the production stylesheet before this suite');
const stylesheet=document.createElement('style');stylesheet.textContent=readFileSync('dist/assets/'+productionCSS,'utf8');document.head.append(stylesheet);
async function settle(){await new Promise(resolve=>setTimeout(resolve,10));}
async function session(id){userId=id;const jwt=[{alg:'HS256',typ:'JWT'},{sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(value=>typeof value==='string'?value:Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');const {error}=await supabase.auth.setSession({access_token:jwt,refresh_token:'isolated-refresh'});assert.ifError(error);}
async function render(path){await act(async()=>{root.render(React.createElement(TestApp,{path,key:++renderId}));await settle();});await act(settle);}
async function click(element){assert.ok(element);await act(async()=>{element.click();await settle();});await act(settle);}
async function change(element,value){assert.ok(element);await act(async()=>{const prototype=element.tagName==='SELECT'?window.HTMLSelectElement.prototype:element.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value);element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));await settle();});}
async function submit(form){assert.ok(form);await act(async()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await settle();});await act(settle);}
const button=text=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===text);
function ok(label,value){assert.ok(value,label);count++;console.log('PASS',label);}
await session(ADMIN);await render('/admin');
ok('Verified administrator enters the full live studio',Boolean(document.querySelector('.admin-layout'))&&!document.querySelector('.sf-admin-preview'));
ok('Production admin CSS uses the storefront cream surface and sage sidebar',getComputedStyle(document.querySelector('.admin-layout')).backgroundColor==='rgb(248, 247, 242)'&&getComputedStyle(document.querySelector('.admin-sidebar')).backgroundColor==='rgb(238, 241, 229)'&&getComputedStyle(document.querySelector('.admin-header')).backgroundColor==='rgb(248, 247, 242)');
ok('All fifteen original and footwear admin modules have navigation',document.querySelectorAll('[aria-label="Administration"] a').length===15);
ok('Dashboard shows real PKR revenue and numeric stock attention',document.body.textContent.includes('PKR 5,300')&&document.body.textContent.includes('1 low stock · 0 sold out'));
await render('/admin/analytics');ok('Analytics shows paid pair and collection sales instead of placeholders',document.body.textContent.includes('Orbit runner')&&document.body.textContent.includes('Sneakers')&&!document.body.textContent.includes('not included'));
await render('/admin/reviews');await click(button('Reject'));await change(document.querySelector('.review-admin-toolbar select'),'rejected');
ok('Reject persists the rejected database status and refreshes the view',reviews[0].status==='rejected'&&document.querySelector('tbody').textContent.includes('rejected'));
await render('/admin/reviews');await change(document.querySelector('.review-admin-toolbar select'),'rejected');ok('A fresh review page retains rejected status',document.querySelector('tbody').textContent.includes('Comfortable in my size'));
await click(button('Mark spam'));await change(document.querySelector('.review-admin-toolbar select'),'spam');ok('Spam moderation persists and uses the spam filter',reviews[0].status==='spam'&&!reviews[0].approved&&document.querySelector('tbody').textContent.includes('spam'));
await render('/admin/orders');await change(document.querySelector('[aria-label="Update status for order 1001"]'),'shipped');ok('Order fulfillment writes through the secure status RPC',orders[0].status==='shipped'&&requests.some(request=>request.path.endsWith('/set_order_status')));
await change(document.querySelector('[aria-label="Payment for order 1001"]'),'refunded');ok('Payment record changes use the separate server RPC',orders[0].payment_status==='refunded');
await render('/admin/settings');const fields=[...document.querySelectorAll('input')];await change(fields[0],'350');await submit(document.querySelector('form'));ok('Delivery settings save PKR input as database cents',settings.shipping_fee_cents===35000);
await render('/admin/products/create');
const labelInput=text=>[...document.querySelectorAll('label')].find(label=>label.textContent.startsWith(text))?.querySelector('input,select,textarea');
await change(labelInput('Product name'),'QA draft pair');await change(labelInput('Price (PKR)'),'6500');await change(labelInput('Category'),'sneakers');await change(document.querySelector('.variant-row label:nth-child(1) input'),'White');await change(document.querySelector('.variant-row label:nth-child(3) input'),'42');await change(document.querySelector('.variant-row label:nth-child(5) input'),'2');await submit(document.querySelector('.editor-form'));
ok('Incomplete footwear details show a useful error without saving',!savedProduct&&document.querySelector('[role="alert"]').textContent.includes('shoe brand'));
await change(labelInput('Brand'),'Nike');await submit(document.querySelector('.editor-form'));
ok('Shoe editor saves a draft with size-specific stock and PKR cents',savedProduct?.price_cents===650000&&savedProduct.variants[0].size==='42'&&savedProduct.variants[0].stock===2);
await render('/admin/customers');const addressReads=requests.filter(request=>request.path==='/rest/v1/addresses').length;
ok('Customers show contact details and load private delivery details on demand',document.body.textContent.includes('buyer@example.invalid')&&document.querySelectorAll('.admin-customer-details').length===2);
await click([...document.querySelectorAll('.admin-customer-details summary')].at(-1));await act(settle);
ok('Opening customer details loads addresses and order history',requests.filter(request=>request.path==='/rest/v1/addresses').length===addressReads+1&&document.querySelectorAll('.admin-customer-details__panel')[1].textContent.includes('Order history'));
await render('/account');ok('Account puts the admin entry and customer actions before forms',Boolean(document.querySelector('.account-overview__admin'))&&document.querySelectorAll('.account-overview a').length===4);
ok('Production account CSS keeps cream backgrounds, dark text and lime actions',getComputedStyle(document.querySelector('.account-page')).backgroundColor==='rgb(248, 247, 242)'&&getComputedStyle(document.querySelector('.account-page')).color==='rgb(32, 37, 31)'&&getComputedStyle(document.querySelector('.account-primary-button')).backgroundColor==='rgb(213, 244, 106)');
await change(document.querySelector('#account-full-name'),'Updated Owner');await submit(document.querySelector('.account-profile__form'));ok('Profile save persists and shows visible feedback',profiles[0].full_name==='Updated Owner'&&document.querySelector('[role="status"]').textContent.includes('Profile updated'));
await click(button('Add address'));await change(document.querySelector('#address-line'),'12 QA Street');await change(document.querySelector('#address-city'),'Lahore');await submit(document.querySelector('.account-address-form'));
ok('Account address creation saves Pakistani delivery details and closes the editor',addresses[0]?.country==='Pakistan'&&addresses[0].line1==='12 QA Street'&&!document.querySelector('.account-address-form'));
await click(document.querySelector('[aria-label="Edit Home address"]'));await change(document.querySelector('#address-city'),'Karachi');await submit(document.querySelector('.account-address-form'));ok('Saved address editing updates the existing address',addresses.length===1&&addresses[0].city==='Karachi');
await click(document.querySelector('[aria-label="Remove Home address"]'));ok('Saved address removal refreshes the account',addresses.length===0&&!document.querySelector('.account-address-card'));
await act(async()=>{await session(CUSTOMER);});requests=[];await render('/admin/products');
ok('Forged admin user metadata cannot grant studio access',document.body.textContent.includes('does not have administrator access')&&!document.querySelector('.admin-layout'));
ok('A blocked customer never loads admin product data',!requests.some(request=>request.path==='/rest/v1/products'));
await render('/account');ok('Customer account never displays the private studio shortcut',!document.querySelector('.account-overview__admin'));
await click(document.querySelector('.account-signout'));ok('Sign out clears the session and returns to enabled sign-in',Boolean(document.querySelector('.auth-submit'))&&!(await supabase.auth.getSession()).data.session);
async function signIn(){await change(document.querySelector('[name="email"]'),profiles.find(profile=>profile.id===userId).email);await change(document.querySelector('[name="password"]'),'only-a-mocked-password');await submit(document.querySelector('.auth-form form'));}
userId=ADMIN;await render('/login');await signIn();
ok('Normal administrator sign-in opens the dashboard from the server role result',Boolean(document.querySelector('.admin-layout')));
await act(async()=>{await supabase.auth.signOut();});await render('/login?returnTo=%2Fcondition-guide');await signIn();
ok('Administrator sign-in still respects an explicitly requested destination',Boolean(document.querySelector('.sf-condition-list'))&&!document.querySelector('.admin-layout'));
await act(async()=>{await supabase.auth.signOut();});userId=CUSTOMER;await render('/login');await signIn();
ok('Normal customer sign-in opens Account without a footer admin link or private shortcut',Boolean(document.querySelector('.account-page'))&&!document.querySelector('.account-overview__admin')&&![...document.querySelectorAll('.sf-footer a')].some(link=>new URL(link.href).pathname.startsWith('/admin')));
await act(async()=>root.unmount());supabase.auth.stopAutoRefresh();console.log('ADMIN AND ACCOUNT COMPONENT CHECKS PASSED:',count);
