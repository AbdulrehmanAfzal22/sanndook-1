import {useEffect,useRef} from 'react';
import {ArrowDown,ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router-dom';

export default function LuxuryHero(){
  const heroRef=useRef(null);

  useEffect(()=>{
    const hero=heroRef.current;
    if(!hero||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;
    const update=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const offset=Math.max(-30,Math.min(30,-hero.getBoundingClientRect().top*.08));
        hero.style.setProperty('--hero-parallax',`${offset}px`);
      });
    };
    window.addEventListener('scroll',update,{passive:true});
    update();
    return()=>{window.removeEventListener('scroll',update);cancelAnimationFrame(frame);};
  },[]);

  return <section ref={heroRef} className="luxury-hero home-hero" aria-labelledby="hero-title" style={{'--hero-image-source':'url("https://images.pexels.com/photos/25746343/pexels-photo-25746343.jpeg?auto=compress&cs=tinysrgb&w=1800")'}}>
    <img className="luxury-hero__image" src="https://images.pexels.com/photos/25746343/pexels-photo-25746343.jpeg?auto=compress&cs=tinysrgb&w=1800" srcSet="https://images.pexels.com/photos/25746343/pexels-photo-25746343.jpeg?auto=compress&cs=tinysrgb&w=900 900w, https://images.pexels.com/photos/25746343/pexels-photo-25746343.jpeg?auto=compress&cs=tinysrgb&w=1400 1400w, https://images.pexels.com/photos/25746343/pexels-photo-25746343.jpeg?auto=compress&cs=tinysrgb&w=2200 2200w" sizes="100vw" alt="A model in sculptural ivory tailoring beside a city car" fetchPriority="high" decoding="async"/>
    <div className="luxury-hero__shade"/>
    <div className="luxury-hero__content">
      <p className="luxury-hero__eyebrow hero-enter hero-enter--one">Soleform <span>—</span> The new chapter</p>
      <h1 id="hero-title" className="luxury-hero__title hero-enter hero-enter--two">Form follows<br/><em>feeling.</em></h1>
      <p className="luxury-hero__description hero-enter hero-enter--three">An edited rotation for days that move<br className="desktop-break"/> between structure and ease.</p>
      <Link className="luxury-outline-button hero-enter hero-enter--four" to="/shop">Explore the collection <ArrowUpRight size={18}/></Link>
    </div>
    <a className="luxury-hero__scroll" href="#brand-statement" aria-label="Scroll to the Soleform story"><span>Discover the collection</span><ArrowDown size={15}/></a>
    <p className="luxury-hero__index" aria-hidden="true">01 / 04</p>
  </section>;
}