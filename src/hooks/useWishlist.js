import {addToWishlist,getWishlist,removeFromWishlist} from '../services/wishlist';
import {useQuery} from './useQuery';
import {useEffect} from 'react';

export function useWishlist(userId,{enabled=true}={}){
  const query=useQuery(()=>enabled&&userId?getWishlist(userId):[],[userId,enabled]);
  useEffect(()=>{const update=e=>{if(enabled&&e.detail?.userId===userId)query.refresh();};window.addEventListener('soleform:wishlist',update);return()=>window.removeEventListener('soleform:wishlist',update);},[userId,enabled,query.refresh]);
  return {
    ...query,
    items:query.data||[],
    add:async productId=>{if(!userId)throw new Error('Sign in to save pieces.');await addToWishlist(userId,productId);if(enabled)await query.refresh();},
    remove:async productId=>{if(!userId)throw new Error('Sign in to manage your wishlist.');await removeFromWishlist(userId,productId);await query.refresh();},
  };
}
