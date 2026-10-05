import {supabase,unwrap,requireBackend} from '../lib/supabase';
import {previewBrands,brandSlug} from '../data/brandDirectory';

export async function getBrands(admin=false){
  if(!supabase)return previewBrands;
  let query=supabase.from('brands').select('id,name,slug,departments,sort_order,is_active').order('sort_order').order('name');
  if(!admin)query=query.eq('is_active',true);
  return unwrap(await query);
}

export async function saveBrand(values){
  requireBackend();
  const name=String(values.name||'').trim(),slug=brandSlug(values.slug||name);
  const departments=['men','women','kids'].filter(department=>values.departments?.includes(department));
  if(!name||name.length>80||!slug||slug.length>100||!departments.length)throw new Error('Enter a brand name and select at least one department.');
  const row={name,slug,departments,sort_order:Number(values.sort_order)||0,is_active:Boolean(values.is_active)};
  const query=values.id?supabase.from('brands').update(row).eq('id',values.id):supabase.from('brands').insert(row);
  return unwrap(await query.select().single());
}

export async function deleteBrand(id){
  requireBackend();
  const row=unwrap(await supabase.from('brands').delete().eq('id',id).select('id').maybeSingle());
  if(!row)throw new Error('Brand not found, or you do not have permission to delete it.');
  return row;
}
