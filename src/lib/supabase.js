import {createClient} from '@supabase/supabase-js';
import project from '../config/backend.public.json';
import storefront from '../config/storefront.public.json';
import {chooseCatalogMode,catalogModeKey} from './catalogMode';
// Public client configuration for the separate shoe project. Privileged keys
// never belong here. A deployment override must supply both values together.
const overrides=Boolean(import.meta.env.VITE_SUPABASE_URL||import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const url=overrides?import.meta.env.VITE_SUPABASE_URL:project.url;
const key=overrides?import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY:project.publishableKey;
let remembered;
try { remembered=window.sessionStorage.getItem(catalogModeKey); } catch { /* Storage may be blocked. */ }
export const catalogMode=chooseCatalogMode({forcedPreview:import.meta.env.VITE_STORE_PREVIEW,search:typeof window==='undefined'?'':window.location.search,pathname:typeof window==='undefined'?'/':window.location.pathname,hash:typeof window==='undefined'?'':window.location.hash,remembered,defaultMode:storefront.defaultCatalogMode});
try { if(import.meta.env.VITE_STORE_PREVIEW!=='true')window.sessionStorage.setItem(catalogModeKey,catalogMode); } catch { /* Query links still work without storage. */ }
export const backendAvailable=Boolean(url&&key);
export const offlinePreview=import.meta.env.VITE_STORE_PREVIEW==='true';
export const backendConfigured=catalogMode==='live'&&backendAvailable;
export const supabase=backendConfigured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'soleform-auth'}}):null;
// The public Instagram feed is independent of the merchandise preview. This
// client never reads or persists a customer's authenticated store session.
let instagramPublicClient;
export function getPublicInstagramClient(){
  if(!backendAvailable||offlinePreview)return null;
  if(!instagramPublicClient)instagramPublicClient=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'soleform-instagram-public'}});
  return instagramPublicClient;
}
export function requireBackend(){if(!supabase)throw new Error('This is the demo collection. Switch to the live store to use your account and real orders.');return supabase;}
export const imageUrl=path=>!path?null:path.startsWith('/')||/^https:\/\//.test(path)?path:supabase?.storage.from('product-images').getPublicUrl(path).data.publicUrl||null;
export const categoryImageUrl=path=>!path?null:path.startsWith('/')||/^https:\/\//.test(path)?path:supabase?.storage.from('category-images').getPublicUrl(path).data.publicUrl||null;
export function unwrap({data,error}){if(error)throw error;return data;}
export const money=cents=>'PKR '+new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format((cents||0)/100);
