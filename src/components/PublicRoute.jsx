import {Navigate,Outlet,useLocation} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {Loading} from './Feedback';

export default function PublicRoute({children,guestOnly=false}){
  const {user,admin,loading}=useAuth();
  const location=useLocation();
  if(guestOnly&&loading)return <Loading label="Checking your session…"/>;
  if(guestOnly&&user){
    const requested=new URLSearchParams(location.search).get('returnTo');
    const safeTarget=requested?.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\');
    const target=safeTarget?requested:'/account';
    return <Navigate to={admin&&target==='/account'?'/admin':target} replace/>;
  }
  return children||<Outlet/>;
}
