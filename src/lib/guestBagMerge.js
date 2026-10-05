// Share one import between route mounts and serialize across browser tabs
// when the Web Locks API is available.
export function createBagMerger(read,remove,locks){
 let pending;
 return function merge(add){
  if(pending)return pending;
  const work=async()=>{for(const row of read()){await add(row.variant_id,row.quantity);remove(row.variant_id);}};
  pending=Promise.resolve().then(()=>locks?locks.request('soleform-guest-bag-import',work):work()).finally(()=>{pending=null;});
  return pending;
 };
}
