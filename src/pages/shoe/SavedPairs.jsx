import {Link} from 'react-router-dom';
import {Heart,ArrowUpRight} from 'lucide-react';
import {useProducts} from '../../hooks/useProducts';
import {useSavedPairs} from '../../hooks/useSavedPairs';
import ShoeCard from '../../components/shoe/ShoeCard';
import {useAuth} from '../../hooks/useAuth';
export default function SavedPairs(){const {user}=useAuth(),q=useProducts(),{saved}=useSavedPairs(),products=(q.data||[]).filter(p=>saved.includes(p.id));return <div className="sf-section sf-saved"><p className="sf-eyebrow">THE PAIRS ON YOUR MIND</p><h1>Your favourites.</h1><p>{user?'Saved to your account, ready on every device.':'Saved on this device, ready for your next move.'}</p>{q.loading?<p>Opening your favourites…</p>:products.length?<div className="sf-product-grid">{products.map(p=><ShoeCard key={p.id} product={p}/>)}</div>:<div className="sf-empty"><Heart size={35}/><h2>A little room for favourites.</h2><p>Tap the heart on a pair you love. Find it here later.</p><Link className="sf-button sf-button-dark" to="/shop">Find your next pair <ArrowUpRight size={19}/></Link></div>}</div>;}
