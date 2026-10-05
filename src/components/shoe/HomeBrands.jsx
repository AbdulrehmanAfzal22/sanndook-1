import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {getBrands} from '../../services/brands';
import {useQuery} from '../../hooks/useQuery';
import BrandPicker from './BrandPicker';
import Reveal from './Reveal';

export default function HomeBrands(){
  const query=useQuery(getBrands,[]),[params,setParams]=useState(()=>new URLSearchParams('department=men'));
  return <Reveal className="sf-section sf-home-brands" id="brand-edit"><div className="sf-section-head"><div><p className="sf-eyebrow">THE NAMES YOU KNOW. YOUR OWN COMBINATION.</p><h2>Big names. <em>Your edit.</em></h2></div><Link className="sf-text-link" to="/brands">Discover brands <ArrowUpRight size={18}/></Link></div>{query.error?<div className="sf-empty"><p>The brand edit is taking a moment.</p><button onClick={query.refresh}>Try again</button></div>:query.loading&&!query.data?<p className="sf-empty">Preparing your brand edit…</p>:<BrandPicker brands={query.data||[]} params={params} onChange={setParams} compact/>}</Reveal>;
}
