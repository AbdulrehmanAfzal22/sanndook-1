import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {backendAvailable,backendConfigured,offlinePreview} from '../lib/supabase';
import {catalogModeHref} from '../lib/catalogMode';

// The demo deliberately has no authenticated SDK. Crossing into a private
// route must create a fresh live client, including when React Router navigates.
export function needsLiveStore(search){
  return !backendConfigured&&backendAvailable&&!offlinePreview&&new URLSearchParams(search).get('catalog')!=='demo';
}
export default function LiveStoreEntry(){
  const location=useLocation();
  const destination=catalogModeHref(location.pathname,location.search,'live')+location.hash;
  useEffect(()=>{window.location.replace(destination);},[destination]);
  return <section className="page" aria-live="polite"><p className="eyebrow">SOLEFORM / SECURE ACCESS</p><h1>Opening your live store.</h1><p>Your account and store administration use the connected Supabase project.</p><a className="button" href={destination}>Continue to the live store</a></section>;
}
