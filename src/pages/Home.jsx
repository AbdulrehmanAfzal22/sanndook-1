import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,ArrowRight,PackageCheck,Ruler,RotateCcw} from 'lucide-react';
import {useProducts} from '../hooks/useProducts';
import {filterFootwear} from '../lib/footwear';
import HomeBrands from '../components/shoe/HomeBrands';
import ShoeReels from '../components/shoe/ShoeReels';
import ShoeProductRail from '../components/shoe/ShoeProductRail';
import Reveal from '../components/shoe/Reveal';

const departments=[['all','For everyone'],['men','Men'],['women','Women'],['kids','Kids']];
const collections=[
  {department:'men',title:'Men',line:'Everyday, elevated.',number:'01',alt:'Taupe suede concept sneakers styled with charcoal trousers in the city'},
  {department:'women',title:'Women',line:'Your own kind of energy.',number:'02',alt:'Ivory and olive concept sneakers with relaxed ivory trousers on stone steps'},
  {department:'kids',title:'Kids',line:'Little feet. Big adventures.',number:'03',alt:'Playful lime and cream concept sneakers at a playground'},
];

export default function Home(){
  const query=useProducts(),[tab,setTab]=useState('all'),products=query.data||[];
  const picks=filterFootwear(products,new URLSearchParams(tab==='all'?'':'department='+tab)).slice(0,20);
  function moveTab(event,index){
    const next=event.key==='ArrowRight'?(index+1)%departments.length:event.key==='ArrowLeft'?(index+departments.length-1)%departments.length:event.key==='Home'?0:event.key==='End'?departments.length-1:null;
    if(next===null)return;
    event.preventDefault();setTab(departments[next][0]);
    document.getElementById('fresh-tab-'+departments[next][0])?.focus();
  }
  return <div className="sf-home sf-landing">
    <section className="sf-campaign sf-campaign-wide" aria-labelledby="campaign-title">
      <img className="sf-campaign-photo" src="/images/campaign/every-step-v3.webp" alt="Original ivory and sage sneakers in warm sunlight on a pale green court" width="1672" height="941" fetchPriority="high" decoding="async"/>
      <div className="sf-campaign-edition"><span>SOLEFORM / THE EVERYDAY EDIT</span><span>GOOD SHOES. GREAT DAYS.</span></div>
      <div className="sf-campaign-copy">
        <p className="sf-eyebrow"><span className="sf-dot"/> FIND A LITTLE EXTRA IN YOUR EVERYDAY</p>
        <h1 id="campaign-title">Make every<br/>step <em>yours.</em></h1>
        <p className="sf-campaign-intro">For the early starts. The long walks. The plans that just happen. Find a pair that feels like you.</p>
        <div className="sf-campaign-actions"><Link to="/shop" className="sf-button sf-button-lime">Shop the collection <ArrowUpRight size={20}/></Link><Link to="/shop?condition=preloved" className="sf-campaign-secondary">Discover preloved <ArrowUpRight size={17}/></Link></div>
        <nav className="sf-campaign-departments" aria-label="Shop a shoe department"><span>YOUR WAY IN</span>{collections.map(collection=><Link key={collection.department} to={'/shop?department='+collection.department}>{collection.title}<ArrowUpRight size={14}/></Link>)}</nav>
      </div>
      <Link to="/shop?category=sneakers" className="sf-campaign-discover"><span><small>THE SNEAKER EDIT</small>Everyday favourites</span><span className="sf-campaign-discover-arrow"><ArrowUpRight size={23}/></span></Link>
    </section>

    <nav className="sf-edit-strip" aria-label="Explore shoe edits">
      <span>YOUR DAY. YOUR WAY.</span>
      {[['The street edit','/shop?category=sneakers'],['Made to move','/shop?category=running'],['Off-duty favourites','/shop?category=casual'],['Preloved, reloved','/shop?condition=preloved']].map(([label,to])=><Link key={label} to={to}>{label}<ArrowUpRight size={15}/></Link>)}
    </nav>

    <Reveal className="sf-section sf-department-collections" id="collections">
      <div className="sf-section-head"><div><p className="sf-eyebrow">THREE WORLDS. YOUR OWN WAY IN.</p><h2>A pair for <em>every chapter.</em></h2></div><Link className="sf-text-link" to="/shop">Explore all shoes <ArrowUpRight size={18}/></Link></div>
      <div className="sf-department-grid">{collections.map((collection,index)=><Link key={collection.department} to={'/shop?department='+collection.department} className="sf-department-card">
        <span className="sf-department-photo"><img src="/images/campaign/collection-worlds-v2.webp" style={{left:(-index*100)+'%'}} alt={collection.alt} width="1536" height="1024" loading="lazy" decoding="async"/></span>
        <span className="sf-department-number">{collection.number} / THE COLLECTION</span>
        <div className="sf-department-caption"><div><h3>{collection.title}</h3><p>{collection.line}</p></div><span className="sf-department-arrow"><ArrowUpRight size={24}/></span></div>
      </Link>)}</div>
    </Reveal>

    <Reveal className="sf-section sf-picks" id="fresh-finds">
      <div className="sf-section-head"><div><p className="sf-eyebrow">THE ROTATION, REFRESHED</p><h2>Fresh finds.<br className="sf-mobile-break"/> <em>Good energy.</em></h2></div><Link className="sf-text-link" to="/shop?sort=newest">View all arrivals <ArrowUpRight size={18}/></Link></div>
      <div className="sf-pick-tabs" role="tablist" aria-label="Featured shoe department">{departments.map(([value,label],index)=><button type="button" role="tab" id={'fresh-tab-'+value} aria-controls="fresh-pairs-panel" key={value} aria-selected={tab===value} tabIndex={tab===value?0:-1} className={tab===value?'active':''} onClick={()=>setTab(value)} onKeyDown={event=>moveTab(event,index)}>{label}</button>)}</div>
      <div id="fresh-pairs-panel" role="tabpanel" aria-labelledby={'fresh-tab-'+tab}>
        {query.error?<div className="sf-empty"><p>We couldn't load the collection.</p><button onClick={query.refresh}>Try again</button></div>:picks.length>0?<ShoeProductRail products={picks} resetKey={tab}/>:null}
        {!query.loading&&!query.error&&!picks.length&&<div className="sf-empty"><h3>New pairs are on the way.</h3><p>The next rotation will appear here as the store adds its collection.</p></div>}
        {query.loading&&!query.data&&<div className="sf-empty" role="status">Preparing your next rotation…</div>}
      </div>
    </Reveal>

    <ShoeReels/>

    <HomeBrands/>

    <Reveal className="sf-fit-band"><div><p className="sf-eyebrow">GOOD STYLE STARTS WITH A GOOD FIT.</p><h2>Your size.<br/><em>Your next pair.</em></h2><p>Know your EU size? Start here. Every link shows pairs available in that size.</p></div><div className="sf-fit-options"><div className="sf-home-sizes" aria-label="Shop shoes available in your EU size">{['36','37','38','39','40','41','42','43','44','45'].map(size=><Link key={size} to={'/shop?size='+size+'&stock=1'} aria-label={'Shop available shoes in EU '+size}><small>EU</small>{size}<ArrowUpRight size={13}/></Link>)}</div><Link to="/size-guide" className="sf-text-link"><Ruler size={17}/> Find your size <ArrowUpRight size={17}/></Link></div></Reveal>

    <Reveal className="sf-benefits">{[[PackageCheck,'Every pair, in detail','Size, material and condition, all in one place.'],[Ruler,'A little less guesswork','Use our sizing guide before choosing a pair.'],[RotateCcw,'A fresh perspective','Explore brand-new and preloved rotations.']].map(([Icon,title,body])=><div key={title}><Icon size={27} strokeWidth={1.5}/><h3>{title}</h3><p>{body}</p></div>)}</Reveal>

    <Reveal className="sf-reloved" aria-labelledby="reloved-title">
      <div className="sf-reloved-copy"><p className="sf-eyebrow"><RotateCcw size={14}/> THE PRELOVED EDIT</p><h2 id="reloved-title">Great pairs.<br/><em>Fresh chapters.</em></h2><p>Timeless favourites. A little character. A whole new story with you. Find your next pair in our preloved collection.</p><div className="sf-reloved-details"><span><Ruler size={15}/> Find your size</span><span><PackageCheck size={15}/> Know the condition</span></div><Link className="sf-button sf-button-lime" to="/shop?condition=preloved">Shop the preloved edit <ArrowUpRight size={20}/></Link><Link className="sf-text-link" to="/condition-guide">A closer look at condition <ArrowRight size={17}/></Link></div>
      <div className="sf-reloved-visual"><img src="/images/campaign/fresh-chapters-v3.webp" alt="Original taupe suede and ivory leather sneaker concepts on a sunlit sage stone plinth" width="1536" height="1024" loading="lazy" decoding="async"/><span className="sf-reloved-seal"><RotateCcw size={22}/><span>GOOD STYLE<br/>GOES AROUND</span></span><span className="sf-reloved-photo-note">ANOTHER CHAPTER AWAITS.</span></div>
    </Reveal>
  </div>;
}
