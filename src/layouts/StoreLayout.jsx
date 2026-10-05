import {Outlet,useLocation} from 'react-router-dom';
import {getStoreRouteMetadata} from '../config/routeMetadata';
import {usePageMetadata} from '../hooks/usePageMetadata';
import ShoeHeader from '../components/shoe/ShoeHeader';
import ShoeFooter from '../components/shoe/ShoeFooter';
import CatalogPreviewBar from '../components/shoe/CatalogPreviewBar';
import {catalogMode} from '../lib/supabase';
export default function StoreLayout(){const location=useLocation();const metadata=getStoreRouteMetadata(location.pathname,location.search);usePageMetadata({...metadata,noindex:catalogMode==='demo'||metadata.noindex});return <div className={'sf-store'+(location.pathname==='/'?' sf-store-home':'')}><a className="skip-link" href="#main">Skip to content</a><ShoeHeader/><CatalogPreviewBar/><main id="main" tabIndex="-1"><Outlet/></main><ShoeFooter/></div>;}
