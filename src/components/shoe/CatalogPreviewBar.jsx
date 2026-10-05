import {useLocation} from 'react-router-dom';
import {ArrowUpRight,Sparkles} from 'lucide-react';
import {backendConfigured,catalogMode} from '../../lib/supabase';
import {catalogModeHref} from '../../lib/catalogMode';

export default function CatalogPreviewBar() {
  const {pathname,search} = useLocation();
  // Demo product IDs and demo bag contents have no matching live merchandise.
  const target = /^\/(product|cart|checkout|saved)(\/|$)/.test(pathname) ? '/shop' : pathname;
  const targetSearch = target === pathname ? search : '';
  return <aside className={`sf-catalog-bar ${catalogMode === 'demo' ? 'is-demo' : 'is-live'}`} aria-label="Catalog mode">
    <div><Sparkles size={15}/><strong>{catalogMode === 'demo' ? 'THE DEMO EDIT' : 'LIVE STORE'}</strong><span>{catalogMode === 'demo' ? '60 original pairs · 20 per department · Preview only' : 'Your real collection, accounts and orders'}</span></div>
    <nav aria-label="Switch catalog"><a href={catalogModeHref(target,targetSearch,'demo')} aria-current={catalogMode === 'demo' ? 'true' : undefined}>Demo collection</a><a href={catalogModeHref(target,targetSearch,'live')} aria-current={backendConfigured ? 'true' : undefined}>Live store <ArrowUpRight size={13}/></a><a className="sf-catalog-admin" href="/admin?catalog=live">Manage store <ArrowUpRight size={13}/></a></nav>
  </aside>;
}
