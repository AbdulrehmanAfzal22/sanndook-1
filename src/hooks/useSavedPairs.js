import {useEffect,useState} from 'react';
import {toast} from 'sonner';
import {backendConfigured} from '../lib/supabase';
import {useAuth} from './useAuth';
import {addToWishlist,getWishlist,removeFromWishlist} from '../services/wishlist';

const key=backendConfigured?'soleform-saved-v1':'soleform-preview-saved-v1';
const cache=new Map(),pending=new Map();
const readLocal=()=>{try{const ids=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(ids)?ids.filter(x=>typeof x==='string'):[];}catch{return [];}};
function emit(){window.dispatchEvent(new Event('soleform:saved'));}
async function loadRemote(userId,force=false){
 if(pending.has(userId)){if(force)pending.get(userId).reload=true;return pending.get(userId).promise;}
 if(!force&&cache.has(userId))return cache.get(userId);
 const entry={reload:false};
 entry.promise=getWishlist(userId).then(rows=>{const ids=rows.map(row=>row.product_id);cache.set(userId,ids);emit();return ids;}).finally(()=>{pending.delete(userId);if(entry.reload)loadRemote(userId,true).catch(()=>{});});
 pending.set(userId,entry);return entry.promise;
}
export function useSavedPairs(){
 const {user}=useAuth()||{},userId=backendConfigured?user?.id:null;
 const read=()=>userId?(cache.get(userId)||[]):readLocal();
 const [saved,setSaved]=useState(read);
 useEffect(()=>{
  const update=()=>setSaved(read());
  const remote=e=>{if(userId&&e.detail?.userId===userId)loadRemote(userId,true).catch(()=>{});};
  update();if(userId)loadRemote(userId).catch(()=>{});
  window.addEventListener('soleform:saved',update);window.addEventListener('soleform:wishlist',remote);
  return()=>{window.removeEventListener('soleform:saved',update);window.removeEventListener('soleform:wishlist',remote);};
 },[userId]);
 function toggle(id){
  const old=read(),adding=!old.includes(id),next=adding?[...old,id]:old.filter(x=>x!==id);
  if(userId){
   cache.set(userId,next);emit();
   (adding?addToWishlist(userId,id):removeFromWishlist(userId,id)).catch(e=>{cache.set(userId,old);emit();toast.error(e.message||'Could not update your saved pair.');});
  }else{localStorage.setItem(key,JSON.stringify(next));emit();}
  return adding;
 }
 return {saved,toggle};
}
