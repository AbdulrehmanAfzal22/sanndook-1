export function httpsMediaUrl(value){
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function instagramUrl(value){
  const safe=httpsMediaUrl(value);if(!safe)return null;
  const url=new URL(safe);return ['instagram.com','www.instagram.com'].includes(url.hostname)?safe:null;
}
export function reelShopDestination(reel){
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reel.product_id||''))return '/product/'+reel.product_id;
  const value=String(reel.shop_url||'').trim();
  if(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\'))return value;
  return httpsMediaUrl(value);
}
