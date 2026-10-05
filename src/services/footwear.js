import {requireBackend,unwrap,backendConfigured} from '../lib/supabase';
import {defaultSettings} from '../lib/deliverySettings';
export {defaultSettings,shippingQuote} from '../lib/deliverySettings';
export async function getStoreSettings(){return backendConfigured?unwrap(await requireBackend().from('store_settings').select('*').eq('id',true).single()):defaultSettings;}
export async function updateStoreSettings(values){return unwrap(await requireBackend().from('store_settings').update(values).eq('id',true).select().single());}
export async function subscribeToStock(userId,variantId){unwrap(await requireBackend().from('stock_notifications').upsert({user_id:userId,variant_id:variantId},{onConflict:'user_id,variant_id',ignoreDuplicates:true}));}
export async function getStockAlerts(userId,admin=false){let query=requireBackend().from('stock_notifications').select('*,product_variants(*,products(id,name,brand,size_system))').order('created_at',{ascending:false});if(!admin)query=query.eq('user_id',userId);const alerts=unwrap(await query)||[];if(!admin||!alerts.length)return alerts;const profiles=unwrap(await requireBackend().from('profiles').select('id,full_name,email').in('id',[...new Set(alerts.map(r=>r.user_id))]))||[];return alerts.map(r=>({...r,customer:profiles.find(p=>p.id===r.user_id)}));}
export async function removeStockAlert(userId,variantId){unwrap(await requireBackend().from('stock_notifications').delete().eq('user_id',userId).eq('variant_id',variantId));}
export async function getExchangeRequests(admin=false){return unwrap(await requireBackend().from('exchange_requests').select('*,order_items(product_name,size,color,order_id),product_variants(size,color)').order('created_at',{ascending:false}));}
export async function requestExchange({userId,orderItemId,replacementVariantId,reason}){return unwrap(await requireBackend().from('exchange_requests').insert({user_id:userId,order_item_id:orderItemId,replacement_variant_id:replacementVariantId||null,reason}).select().single());}
export async function updateExchange(id,values){return unwrap(await requireBackend().from('exchange_requests').update(values).eq('id',id).select().single());}
