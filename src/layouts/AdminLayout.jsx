import {useEffect,useState} from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {usePageMetadata} from '../hooks/usePageMetadata';
import {supabase} from '../lib/supabase';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import './AdminLayout.css';
import '../components/admin/admin-experience.css';
import {adminPageTitle} from '../config/navigation';
import {toast} from 'sonner';

export default function AdminLayout(){
  const {user,refresh}=useAuth();
  const location=useLocation();
  const title=adminPageTitle(location.pathname);
  const [collapsed,setCollapsed]=useState(()=>window.innerWidth<=1100);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [signingOut,setSigningOut]=useState(false);
  async function signOut(){
    setSigningOut(true);
    try{const {error}=await supabase.auth.signOut();if(error)throw error;await refresh();}
    catch(error){toast.error(error.message);}
    finally{setSigningOut(false);}
  }
  useEffect(()=>{if(!mobileOpen)return;const closeOnEscape=event=>{if(event.key==='Escape')setMobileOpen(false);};window.addEventListener('keydown',closeOnEscape);return()=>window.removeEventListener('keydown',closeOnEscape);},[mobileOpen]);
  usePageMetadata({title:`${title} · Studio`,description:'Soleform store administration.',noindex:true});

  return <div className={`admin-layout admin-layout--premium ${collapsed?'is-collapsed':''}`}>
    <AdminSidebar user={user} signingOut={signingOut} collapsed={collapsed} mobileOpen={mobileOpen} onToggle={()=>setCollapsed(value=>!value)} onClose={()=>setMobileOpen(false)} onSignOut={signOut}/>
    <div className="admin-main"><AdminHeader pathname={location.pathname} user={user} collapsed={collapsed} mobileOpen={mobileOpen} onToggle={()=>setCollapsed(value=>!value)} onMenu={()=>setMobileOpen(true)}/><main className="admin-content"><Outlet/></main></div>
  </div>;
}
