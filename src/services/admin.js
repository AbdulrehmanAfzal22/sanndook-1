import { supabase } from "../lib/supabase";

export async function checkAdminAccess(userId) {
  if (!userId||!supabase) return false;
  const {data,error}=await supabase.auth.getUser();
  if(error||data.user?.id!==userId)return false;
  const role=await supabase.rpc('is_admin');
  return !role.error&&role.data===true;
}
