import {Link,Navigate,Outlet,useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {ErrorState,Loading} from './Feedback';
import {backendConfigured} from '../lib/supabase';
import AdminPreview from '../pages/shoe/AdminPreview';
import LiveStoreEntry,{needsLiveStore} from './LiveStoreEntry';

export default function AdminRoute({children}){
  const {user,admin,loading,error}=useAuth();
  const location=useLocation();
  if(needsLiveStore(location.search))return <LiveStoreEntry/>;
  if(!backendConfigured)return <AdminPreview/>;
  if(loading)return <Loading label="Checking administrator access…"/>;
  if(error)return <ErrorState error={error}/>;
  if(!user)return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`} replace/>;
  if(!admin)return <section className="page"><h1>Private studio.</h1><p>Your account does not have administrator access.</p><p>The studio is reserved for the verified store owner and approved administrators.</p><Link className="button" to="/account">Back to account</Link></section>;
  return children||<Outlet/>;
}
