// Execute the actual Deno handler in Node with mocked Auth, database and Meta.
// No token, account or media request leaves this process.
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
mkdirSync('.qa',{recursive:true});
let handler,identity=null,profileUser='store.qa',providerFails=false,storedConnection=null,graphCalls=[],writes=[],logs=[],cachedMedia=[];
const settings={id:true,username:'store.qa',profile_url:'https://www.instagram.com/store.qa/',reels_to_display:10,is_enabled:false,autoplay_enabled:true,autoplay_interval_seconds:5,desktop_cards:4,mobile_cards:1.2,last_synced_at:null};
const environment={SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'qa-server-only',SUPABASE_ANON_KEY:'qa-public'};
globalThis.Deno={env:{get:name=>environment[name]},serve:fn=>{handler=fn;}};
const builder=table=>{
 let filters=[],limit=null,range=null,update=null,count=false;
 const result=()=>{
  let data=table==='instagram_feed_settings'?settings:table==='instagram_private_connection'?storedConnection:cachedMedia.filter(row=>filters.every(filter=>filter(row)));
  if(update){if(Array.isArray(data))data.forEach(row=>Object.assign(row,update));else if(data)Object.assign(data,update);update=null;}
  const total=Array.isArray(data)?data.length:null;
  if(Array.isArray(data)){data=[...data].sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)));if(range)data=data.slice(range[0],range[1]+1);if(limit!==null)data=data.slice(0,limit);}
  return {data,error:null,...(count?{count:total}:{})};
 };
 const q={select(_columns,options){count=options?.count==='exact';return q;},eq(column,value){filters.push(row=>row[column]===value);return q;},in(column,values){filters.push(row=>values.includes(row[column]));return q;},not(column,operator,value){if(operator==='is')filters.push(row=>row[column]!==value);if(operator==='in'){const ids=value.slice(1,-1).split(',');filters.push(row=>!ids.includes(row[column]));}return q;},order(){return q;},limit(value){limit=value;return q;},range(start,end){range=[start,end];return q;},maybeSingle:async()=>result(),single:async()=>result(),
  upsert:async row=>{writes.push({table,row});if(table==='instagram_private_connection')storedConnection={...row};if(table==='instagram_reels')for(const item of row){const previous=cachedMedia.find(existing=>existing.media_id===item.media_id);if(previous)Object.assign(previous,item);else cachedMedia.push({...item});}return {error:null};},
  update:row=>{writes.push({table,row});update=row;return q;},
  then:resolve=>Promise.resolve(result()).then(resolve)};
 return q;
};
globalThis.__igCreateClient=()=>({from:builder,auth:{getUser:async()=>({data:{user:identity?{id:identity}:null}})},rpc:async()=>({data:identity==='admin',error:null})});
globalThis.fetch=async(url,options)=>{
 graphCalls.push({url:String(url),options});
 const path=new URL(url).pathname;
 const media=[
  {id:'qa-reel',media_type:'VIDEO',media_product_type:'REELS',media_url:'https://cdn.example.invalid/reel.mp4',thumbnail_url:'https://cdn.example.invalid/poster.jpg',permalink:'https://www.instagram.com/reel/qa-reel/',caption:'A real-shaped Reel',timestamp:'2026-10-05T09:00:00Z',like_count:17,comments_count:3},
  {id:'qa-photo',media_type:'IMAGE',media_url:'https://cdn.example.invalid/photo.jpg',permalink:'https://www.instagram.com/p/qa-photo/',caption:'Shoe details',timestamp:'2026-10-04T09:00:00Z'},
  {id:'qa-album',media_type:'CAROUSEL_ALBUM',children:{data:[{media_type:'IMAGE',media_url:'https://cdn.example.invalid/album-cover.jpg'}]},permalink:'https://www.instagram.com/p/qa-album/',timestamp:'2026-10-03T09:00:00Z'},
  {id:'qa-unsupported',media_type:'UNKNOWN',media_url:'https://cdn.example.invalid/unknown',permalink:'https://www.instagram.com/p/qa-unsupported/'}
 ];
 const body=providerFails?{error:{message:'Provider error with a token'}}:path.endsWith('/media')?{data:media}:path.endsWith('/insights')?{data:[{name:'views',values:[{value:1234}]}]}:{user_id:'123456789',username:profileUser,profile_picture_url:'https://cdn.example.invalid/photo.jpg'};
 return new Response(JSON.stringify(body),{status:providerFails?400:200,headers:{'Content-Type':'application/json'}});
};
const originalError=console.error;console.error=(...args)=>logs.push(args.join(' '));
await build({entryPoints:['supabase/functions/instagram-feed/index.ts'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/instagram-edge.cjs',plugins:[{name:'mock-supabase',setup(build){build.onResolve({filter:/^https:\/\/esm.sh\//},()=>({path:'supabase',namespace:'qa'}));build.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const createClient=(...args)=>globalThis.__igCreateClient(...args);',loader:'js'}));}}]});
createRequire(import.meta.url)('../../.qa/instagram-edge.cjs');
let count=0;
async function check(label,fn){await fn();count++;console.log('PASS',label);}
const accessToken='qa-instagram-token-that-is-never-sent-to-a-real-service';
async function request(action,body={}){const response=await handler(new Request('https://function.example.invalid/',{method:'POST',headers:{'Content-Type':'application/json',...(identity?{Authorization:'Bearer qa-session'}:{})},body:JSON.stringify({action,...body})}));return {response,body:await response.json()};}
await check('Unconnected public Instagram feed returns a clean empty state',async()=>{const result=await request('feed');assert.equal(result.response.status,200);assert.equal(result.body.connected,false);assert.deepEqual(result.body.items,[]);assert.equal(graphCalls.length,0);});
await check('Anonymous users cannot submit Instagram tokens or trigger Meta requests',async()=>{const result=await request('connect-token',{access_token:accessToken});assert.equal(result.response.status,401);assert.equal(graphCalls.length,0);assert.equal(writes.length,0);});
identity='customer';
await check('A signed-in customer cannot replace the store Instagram token',async()=>{const result=await request('connect-token',{access_token:accessToken});assert.equal(result.response.status,401);assert.equal(graphCalls.length,0);assert.equal(writes.length,0);});
identity='admin';
await check('Invalid or expired manual credentials are rejected before calling Meta',async()=>{assert.equal((await request('connect-token',{access_token:'short'})).response.status,400);assert.equal((await request('connect-token',{access_token:accessToken,expires_at:'2000-01-01'})).response.status,400);assert.equal(graphCalls.length,0);});
profileUser='another.account';
await check('The token must belong to the configured Instagram username',async()=>{const result=await request('connect-token',{access_token:accessToken});assert.equal(result.response.status,400);assert.equal(writes.length,0);});
profileUser='store.qa';providerFails=true;
await check('Provider failures never echo credentials or raw provider details',async()=>{const result=await request('connect-token',{access_token:accessToken});assert.equal(result.response.status,400);assert.ok(!JSON.stringify(result.body).includes(accessToken));assert.ok(!JSON.stringify(result.body).includes('Provider error'));});
providerFails=false;
await check('Admin connection stores a server-only token, with unknown expiry left unknown',async()=>{
 const result=await request('connect-token',{access_token:accessToken});assert.equal(result.response.status,200);assert.equal(result.body.connected,true);
 assert.equal(storedConnection.access_token,accessToken);assert.equal(storedConnection.token_expires_at,null);assert.equal(settings.is_enabled,true);
 assert.ok(!JSON.stringify(result.body).includes(accessToken));assert.equal(graphCalls.at(-1).options.headers.Authorization,'Bearer '+accessToken);assert.ok(!graphCalls.at(-1).url.includes(accessToken));assert.ok(!logs.join().includes(accessToken));
});
await check('Known future token expiry is preserved for refresh management',async()=>{const expiresAt=new Date(Date.now()+30*86400000).toISOString();await request('connect-token',{access_token:accessToken,expires_at:expiresAt});assert.equal(storedConnection.token_expires_at,expiresAt);});
cachedMedia=[{media_id:'qa-reel',category:'Sneakers',product_id:'10000000-0000-4000-8000-000000000001',shop_url:'/shop?category=sneakers',is_active:true,published_at:'2026-10-01T09:00:00Z'},{media_id:'qa-old',is_active:true,published_at:'2026-09-01T09:00:00Z'}];
await check('One authorized refresh caches Reels, photos and carousel covers with actual metrics',async()=>{
 const result=await request('refresh');assert.equal(result.response.status,200);assert.equal(result.body.refreshed,3);
 const reel=cachedMedia.find(item=>item.media_id==='qa-reel');assert.equal(reel.like_count,17);assert.equal(reel.comment_count,3);assert.equal(reel.view_count,1234);assert.equal(reel.product_id,'10000000-0000-4000-8000-000000000001');assert.equal(reel.shop_url,'/shop?category=sneakers');
 assert.equal(cachedMedia.find(item=>item.media_id==='qa-album').thumbnail_url,'https://cdn.example.invalid/album-cover.jpg');assert.equal(cachedMedia.find(item=>item.media_id==='qa-photo').like_count,null);assert.equal(cachedMedia.find(item=>item.media_id==='qa-old').is_active,false);
 const mediaUrl=new URL(graphCalls.find(call=>new URL(call.url).pathname.endsWith('/media')).url);assert.ok(mediaUrl.searchParams.get('fields').includes('children{'));assert.ok(mediaUrl.searchParams.get('fields').includes('comments_count'));
});
identity=null;
await check('Anonymous feed reads cached mixed media without exposing or revalidating the access token',async()=>{
 const calls=graphCalls.length,result=await request('feed');assert.equal(result.response.status,200);assert.equal(result.body.connected,true);assert.equal(result.body.items.length,3);assert.deepEqual(result.body.items.map(item=>item.media_type),['VIDEO','IMAGE','CAROUSEL_ALBUM']);assert.equal(graphCalls.length,calls);assert.ok(!JSON.stringify(result.body).includes(accessToken));assert.equal(result.body.items[0].profile_image,'https://cdn.example.invalid/photo.jpg');
});
storedConnection=null;cachedMedia=[];Object.assign(settings,{username:'',profile_url:'https://www.instagram.com/',is_enabled:false,last_synced_at:null});
environment.INSTAGRAM_ACCESS_TOKEN='qa-server-environment-token-never-sent-to-a-real-service';
await check('A server environment token alone activates the disabled feed and discovers the real username',async()=>{
 const privateWrites=writes.filter(write=>write.table==='instagram_private_connection'&&write.row.access_token).length,result=await request('feed');
 assert.equal(result.response.status,200);assert.equal(result.body.connected,true);assert.equal(result.body.items.length,3);assert.equal(result.body.settings.username,'store.qa');assert.equal(result.body.settings.profile_url,'https://www.instagram.com/store.qa/');assert.equal(result.body.settings.is_enabled,true);
 assert.equal(storedConnection,null);assert.equal(writes.filter(write=>write.table==='instagram_private_connection'&&write.row.access_token).length,privateWrites);assert.ok(!JSON.stringify(result.body).includes(environment.INSTAGRAM_ACCESS_TOKEN));
 const profile=graphCalls.filter(call=>new URL(call.url).pathname.endsWith('/me')).at(-1);assert.equal(profile.options.headers.Authorization,'Bearer '+environment.INSTAGRAM_ACCESS_TOKEN);assert.ok(!profile.url.includes(environment.INSTAGRAM_ACCESS_TOKEN));
});
await check('Repeated environment-backed feed requests reuse verified profile and cached public media',async()=>{
 const before=graphCalls.length,result=await request('feed');assert.equal(result.body.items.length,3);assert.equal(graphCalls.length,before);
});
identity='admin';
await check('Admin status explains environment ownership without leaking or replacing its credential',async()=>{
 const result=await request('status');assert.equal(result.body.connection_source,'environment');assert.equal(result.body.username,'store.qa');assert.ok(!JSON.stringify(result.body).includes(environment.INSTAGRAM_ACCESS_TOKEN));assert.equal((await request('connect-token',{access_token:accessToken})).response.status,409);assert.equal((await request('disconnect')).response.status,409);
});
await check('Environment-managed layout changes save without changing the private connection enable state',async()=>{
 const result=await request('save-settings',{...settings,is_enabled:true,desktop_cards:5});assert.equal(result.response.status,200);assert.equal(settings.desktop_cards,5);assert.equal(settings.is_enabled,false);assert.equal((await request('feed')).body.connected,true);
});
identity=null;environment.INSTAGRAM_FEED_ENABLED='false';
await check('An explicit environment disable hides cached posts and avoids provider requests',async()=>{
 const before=graphCalls.length,result=await request('feed');assert.equal(result.body.connected,false);assert.equal(result.body.settings.is_enabled,false);assert.deepEqual(result.body.items,[]);assert.equal(graphCalls.length,before);
});
delete environment.INSTAGRAM_FEED_ENABLED;environment.INSTAGRAM_ACCESS_TOKEN='qa-replacement-environment-token';providerFails=true;
await check('An invalid replacement environment token reports a sanitized failure instead of stale posts',async()=>{
 const result=await request('feed');assert.equal(result.response.status,502);assert.equal(result.body.success,false);assert.equal(result.body.message,'Unable to retrieve Instagram media.');assert.ok(!JSON.stringify(result.body).includes(environment.INSTAGRAM_ACCESS_TOKEN));assert.ok(!logs.join().includes(environment.INSTAGRAM_ACCESS_TOKEN));
});
providerFails=false;delete environment.INSTAGRAM_ACCESS_TOKEN;
await check('Removing the environment token restores a clean unconnected feed',async()=>{
 const result=await request('feed');assert.equal(result.body.connected,false);assert.deepEqual(result.body.items,[]);
});
console.error=originalError;console.log('INSTAGRAM EDGE CHECKS PASSED:',count);
