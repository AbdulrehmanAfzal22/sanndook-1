import {useSearchParams} from 'react-router-dom';
import {getBrands} from '../../services/brands';
import {useQuery} from '../../hooks/useQuery';
import BrandPicker from '../../components/shoe/BrandPicker';
import Reveal from '../../components/shoe/Reveal';

export default function Brands(){
  const query=useQuery(getBrands,[]),[params,setParams]=useSearchParams();
  return <div className="sf-brand-page"><Reveal as="header" className="sf-brand-page-heading"><p className="sf-eyebrow">A LITTLE SPORT. A LITTLE LUXURY. ALL YOU.</p><h1>All your favourites.<br/><em>One good rotation.</em></h1><p>Explore brands for Men, Women and Kids. Choose a few names and discover their shoes together.</p><span className="sf-brand-page-star" aria-hidden="true">✳</span></Reveal><section className="sf-brand-page-content" aria-label="Choose shoe brands">{query.loading&&!query.data?<div className="sf-empty">Finding your favourites…</div>:query.error?<div className="sf-empty"><h2>We couldn't load the brands.</h2><button className="sf-button sf-button-dark" onClick={query.refresh}>Try again</button></div>:<BrandPicker brands={query.data||[]} params={params} onChange={setParams}/>}</section></div>;
}
