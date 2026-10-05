import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import {supabase,unwrap} from '../lib/supabase';
import {ensureCustomerProfile} from '../services/supportService';
const Context=createContext(null);
export function SessionProvider({children}){
 const [user,setUser]=useState(null),[admin,setAdmin]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase){setLoading(false);setUser(null);setAdmin(false);return {user:null,admin:false};}
  try{setError('');const {data,error}=await supabase.auth.getUser();
   if(error && error.name!=='AuthSessionMissingError') throw error;
   let allowed=false;
   if(data.user){await ensureCustomerProfile();allowed=!!unwrap(await supabase.rpc('is_admin'));}
   // Publish the user and server-authorized role together so guest routes do
   // not redirect while the membership lookup is still in progress.
   setUser(data.user);
   setAdmin(allowed);
   return {user:data.user,admin:allowed};
  }catch(e){setError(e.message);setAdmin(false);return {error:e.message,admin:false};}finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();if(!supabase)return;const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{setTimeout(refresh,0)});return()=>subscription.unsubscribe();},[refresh]);
 return <Context.Provider value={{user,admin,loading,error,refresh}}>{children}</Context.Provider>;
}
export const useSession=()=>useContext(Context);
