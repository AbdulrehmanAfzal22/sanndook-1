import {ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useQuery} from '../hooks/useQuery';
import {useProducts} from '../hooks/useProducts';
import {getActiveCategories} from '../services/catalog';
import {categoryImageUrl,imageUrl} from '../lib/supabase';
import {ErrorState,Loading} from '../components/Feedback';
import {usePageMetadata} from '../hooks/usePageMetadata';
import {categoriesForSection} from '../lib/categoryMatching';

export default function Collections({isAccessory=false}){
 const q=useQuery(()=>getActiveCategories(isAccessory),[isAccessory]),products=useProducts();
 const title=isAccessory?'The finishing touches.':'Every kind of next step.',base=isAccessory?'/accessories':'/collections';
 usePageMetadata({title:isAccessory?'Shoe accessories':'Shoe collections',description:'Find your next pair by style, from everyday sneakers to leather lace-ups.'});
 if(q.loading||products.loading)return <Loading label="Opening the edit…"/>;
 if(q.error||products.error)return <ErrorState error={q.error||products.error} retry={()=>{q.refresh();products.refresh();}}/>;
 const categories=categoriesForSection(q.data,isAccessory);
 return <section className="sf-section sf-collections"><p className="sf-eyebrow">{isAccessory?'CARE FOR YOUR ROTATION':'FIND YOUR FOOTING'}</p><h1>{title}</h1><p>{isAccessory?'Shoe care and accessories to keep your favourite pairs going.':'One good pair can change the whole day. Start with your style.'}</p>{categories.length?<div className="sf-collection-grid">{categories.map(c=>{const pairs=(products.data||[]).filter(p=>p.category_id===c.id),photo=c.image_path?categoryImageUrl(c.image_path):imageUrl(pairs[0]?.product_images?.[0]?.path);return <Link key={c.id} to={base+'/'+encodeURIComponent(c.slug)} className="sf-collection-tile"><div>{photo?<img src={photo} alt={c.image_alt||c.name} loading="lazy"/>:<span className="sf-collection-placeholder">{c.name.slice(0,1)}</span>}</div><span><strong>{c.name}</strong><ArrowUpRight size={22}/></span><small>{pairs.length} {pairs.length===1?'item':'items'}</small></Link>;})}</div>:<div className="sf-empty"><h2>A new edit is on its way.</h2><p>Discover the shoes in the current rotation.</p><Link className="sf-button sf-button-dark" to="/shop">Explore the shoes <ArrowUpRight size={18}/></Link></div>}</section>;
}
