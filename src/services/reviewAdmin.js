import { supabase, unwrap } from '../lib/supabase';
export const getAdminReviews = async () => unwrap(await supabase.from('reviews').select('*,products(name)').order('created_at', { ascending: false }));
export const setReviewStatus = async (id, status) => {
  if(!['pending','approved','rejected','spam'].includes(status))throw new Error('Choose a valid review status.');
  return unwrap(await supabase.from('reviews').update({status}).eq('id',id).select('id,status,approved').single());
};
export const approveReview = (id, approved) => setReviewStatus(id,approved?'approved':'rejected');
export const deleteReview = async id => unwrap(await supabase.from('reviews').delete().eq('id', id));
