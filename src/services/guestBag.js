import {getProduct} from './catalog';
import {backendConfigured} from '../lib/supabase';
import {createBagMerger} from '../lib/guestBagMerge';
const key=backendConfigured?'soleform-bag-v1':'soleform-preview-bag-v1';
export function readGuestBag(){try{return JSON.parse(localStorage.getItem(key)||'[]').filter(x=>typeof x.variant_id==='string'&&Number.isInteger(x.quantity)&&x.quantity>0);}catch{return [];}}
export function writeGuestBag(rows){localStorage.setItem(key,JSON.stringify(rows));window.dispatchEvent(new CustomEvent('soleform:bag'));}
export function addGuestPair(product,variant,quantity=1){const rows=readGuestBag(),row=rows.find(x=>x.variant_id===variant.id),next=(row?.quantity||0)+quantity;if(!variant.active||next>variant.stock||next>99)throw new Error('Only '+variant.stock+' available in this size.');if(row)row.quantity=next;else rows.push({variant_id:variant.id,product_id:product.id,quantity});writeGuestBag(rows);}
export async function getGuestBag(){return Promise.all(readGuestBag().map(async row=>{const p=await getProduct(row.product_id),v=p?.product_variants.find(x=>x.id===row.variant_id);return {...row,product_variants:v?{...v,products:p}:null};}));}
export function setGuestQuantity(id,quantity,stock){if(!Number.isInteger(quantity)||quantity<1||quantity>Math.min(stock,99))throw new Error('Choose a quantity within the available stock.');writeGuestBag(readGuestBag().map(r=>r.variant_id===id?{...r,quantity}:r));}
export function removeGuestPair(id){writeGuestBag(readGuestBag().filter(r=>r.variant_id!==id));}
export const mergeGuestBag=createBagMerger(readGuestBag,removeGuestPair,globalThis.navigator?.locks);
