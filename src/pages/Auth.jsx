import {useState} from 'react';
import {ArrowRight,Eye,EyeOff} from 'lucide-react';
import {Link,useLocation,useNavigate,useSearchParams} from 'react-router-dom';
import {supabase,unwrap,backendConfigured} from '../lib/supabase';
import {useAuth} from '../hooks/useAuth';
import {usePageMetadata} from '../hooks/usePageMetadata';
import LiveStoreEntry,{needsLiveStore} from '../components/LiveStoreEntry';
export default function Auth(){
 const [params]=useSearchParams(),nav=useNavigate(),routerLocation=useLocation(),{refresh}=useAuth();
 const routeMode=routerLocation.pathname==='/register'?'signup':routerLocation.pathname==='/reset-password'?'reset':'login';
 const requestedMode=params.get('mode'),mode=['signup','forgot','reset'].includes(requestedMode)?requestedMode:routeMode, [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[passwordVisible,setPasswordVisible]=useState(false);
 usePageMetadata({title:({login:'Sign in',signup:'Create an account',forgot:'Reset your password',reset:'Choose a new password'})[mode],description:'Access your Soleform account and footwear rotation.',noindex:true});
 const requested=params.get('returnTo')||'/account',returnTo=requested.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\')?requested:'/account';
 const adminEntry=/^\/admin(?:\/|$)/.test(returnTo.split(/[?#]/)[0]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');setMessage('');const f=Object.fromEntries(new FormData(e.currentTarget));
  try{
   if(!supabase)throw new Error('Switch to the live store to sign in. You can browse, save pairs and use the demo bag here.');
    if(mode==='forgot'){unwrap(await supabase.auth.resetPasswordForEmail(f.email,{redirectTo:window.location.origin+'/reset-password'}));setMessage('If this address is registered, a reset link will arrive shortly.');}
   else if(mode==='reset'){unwrap(await supabase.auth.updateUser({password:f.password}));setMessage('Password updated. You can continue to your account.');}
    else if(mode==='signup'){const d=unwrap(await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.full_name},emailRedirectTo:window.location.origin+'/login?returnTo='+encodeURIComponent(returnTo)}}));if(d.session){await refresh();nav(returnTo);}else setMessage('Check your inbox to verify your email before signing in.');}
   else {unwrap(await supabase.auth.signInWithPassword({email:f.email,password:f.password}));const access=await refresh();if(access?.error)throw new Error(access.error);nav(access?.admin&&returnTo==='/account'?'/admin':returnTo,{replace:true});}
  }catch(err){setError(err.message);}finally{setBusy(false);}
 }
 if(needsLiveStore(routerLocation.search))return <LiveStoreEntry/>;
 return <section className={`auth-page auth-page--premium auth-page--${mode} ${adminEntry?'auth-page--admin':''}`}>
  <div className="auth-art" aria-label="Soleform footwear campaign">
   <img className="auth-art__image" src="/images/campaign/next-move-v2.webp" width="1536" height="1024" alt="Cream and lime Soleform sneakers on sunlit stone steps" fetchPriority="high"/>
   <div className="auth-art__copy">
   <p className="eyebrow auth-art__label">{adminEntry?'THE SOLEFORM STUDIO':'THE SOLEFORM ROTATION'}</p>
   <h1 className="auth-art__title">{adminEntry?<>Your store.<br/>Your space.</>:<>A little more<br/>you.</>}</h1>
   <p className="auth-art__note">{adminEntry?'Every pair. Every order. One place.':'Pairs for a life in motion.'}</p>
   </div>
  </div>
  <div className="auth-form">
   <div className="auth-form__inner">
    <p className="eyebrow auth-form__eyebrow">{adminEntry?'SOLEFORM / ADMIN PORTAL':'YOUR NEXT ROTATION'}</p>
    <h1>{({login:'Welcome back.',signup:'Make yourself at home.',forgot:'A fresh start.',reset:'Choose a new password.'})[mode]}</h1>
    <p className="auth-form__intro">{mode==='login'?(adminEntry?'Sign in with your verified store-owner or administrator account to manage Soleform.':'Save your favourites, keep your bag and follow every order.'):mode==='signup'?'Create an account to keep your favourites and follow every order.':mode==='forgot'?'We’ll send a secure link if an account matches that email.':'Choose a new password for your Soleform account.'}</p>
    {!backendConfigured&&<p className="auth-preview" role="status">This is the store preview. Accounts and orders are not open in demo mode. Switch to the live store to sign in, or keep exploring the sample collection.</p>}
    <form onSubmit={submit}>
     {mode==='signup'&&<label htmlFor="auth-full-name">Full name<input id="auth-full-name" className="auth-input" name="full_name" autoComplete="name" maxLength="150" required/></label>}
     {mode!=='reset'&&<label htmlFor="auth-email">Email address<input id="auth-email" className="auth-input" name="email" type="email" autoComplete="email" required/></label>}
     {mode!=='forgot'&&<label htmlFor="auth-password">Password<div className="auth-password-field"><input id="auth-password" className="auth-input" name="password" type={passwordVisible?'text':'password'} minLength="8" autoComplete={mode==='login'?'current-password':'new-password'} required/><button type="button" className="auth-password-toggle" onClick={()=>setPasswordVisible(value=>!value)} aria-label={passwordVisible?'Hide password':'Show password'} aria-pressed={passwordVisible}>{passwordVisible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
     {error&&<p className="error auth-feedback" role="alert">{error}</p>}{message&&<p className="notice auth-feedback" role="status">{message}</p>}
     <button className="button auth-submit" type="submit" disabled={busy||!backendConfigured} aria-busy={busy}>{busy?<><span className="auth-submit__spinner" aria-hidden="true"/>Please wait…</>:<>{({login:'Sign in',signup:'Create account',forgot:'Send reset link',reset:'Update password'})[mode]}<ArrowRight size={17}/></>}</button>
    </form>
    <div className="auth-links">{mode==='login'?<><Link to={'/register?returnTo='+encodeURIComponent(returnTo)}>Create an account</Link><Link to="/reset-password?mode=forgot">Forgot password?</Link></>:<Link to={'/login?returnTo='+encodeURIComponent(returnTo)}>Back to sign in</Link>}</div>
   </div>
  </div>
 </section>;
}
