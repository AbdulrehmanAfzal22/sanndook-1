import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import ShoeCard from './ShoeCard';

export default function ShoeProductRail({products,resetKey}){
  const track=useRef(null),[range,setRange]=useState({first:1,last:1,atStart:true,atEnd:true});
  function measure(){
    const element=track.current;if(!element)return;
    const gap=parseFloat(window.getComputedStyle(element).columnGap)||20;
    const cardWidth=element.firstElementChild?.getBoundingClientRect().width||element.clientWidth;
    const stride=Math.max(1,cardWidth+gap),max=Math.max(0,element.scrollWidth-element.clientWidth);
    const first=Math.min(products.length,Math.floor(Math.max(0,element.scrollLeft)/stride)+1);
    const last=Math.min(products.length,first+Math.max(1,Math.ceil(element.clientWidth/stride))-1);
    const next={first,last,atStart:element.scrollLeft<=2,atEnd:element.scrollLeft>=max-2};
    setRange(current=>Object.keys(next).every(key=>current[key]===next[key])?current:next);
  }
  function scrollTo(left){
    const element=track.current;if(!element)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(element.scrollTo)element.scrollTo({left,behavior:reduced?'instant':'smooth'});else element.scrollLeft=left;
    measure();
  }
  function step(direction){
    const element=track.current;if(!element)return;
    const gap=parseFloat(window.getComputedStyle(element).columnGap)||20;
    const cardWidth=element.firstElementChild?.getBoundingClientRect().width||element.clientWidth;
    const stride=Math.max(1,cardWidth+gap),visible=Math.max(1,Math.floor((element.clientWidth+gap)/stride));
    scrollTo(Math.max(0,Math.min(element.scrollWidth-element.clientWidth,element.scrollLeft+direction*visible*stride)));
  }
  useEffect(()=>{
    const element=track.current;if(!element)return;
    // A department change starts at its first pair without scrolling through the
    // previous department. Observe width changes to keep the controls accurate.
    element.scrollLeft=0;measure();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
    observer?.observe(element);window.addEventListener('resize',measure);
    return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
  },[resetKey,products.length]);
  return <div className="sf-product-rail">
    <div className="sf-product-track" id="fresh-shoe-track" ref={track} onScroll={measure} role="region" aria-label="Fresh shoe collection; use arrow keys or swipe to browse" tabIndex="0" onKeyDown={event=>{
      if(event.target!==event.currentTarget)return;
      if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}
      else if(event.key==='Home'||event.key==='End'){event.preventDefault();scrollTo(event.key==='Home'?0:Math.max(0,event.currentTarget.scrollWidth-event.currentTarget.clientWidth));}
    }}>{products.map((product,index)=><ShoeCard product={product} key={product.id} index={index}/>)}</div>
    <div className="sf-product-rail-bottom"><div><span className="sf-rail-count">{String(products.length).padStart(2,'0')} PAIRS IN THIS EDIT</span><p>Find a favourite. Choose your size. Make it yours.</p></div><div className="sf-product-rail-controls"><span className="sf-rail-position" aria-live="polite" aria-atomic="true"><span className="sr-only">Showing pairs </span>{String(range.first).padStart(2,'0')}—{String(range.last).padStart(2,'0')}<span className="sr-only"> of {products.length}</span></span><button type="button" aria-label="Previous shoe pairs" aria-controls="fresh-shoe-track" disabled={range.atStart} onClick={()=>step(-1)}><ArrowLeft size={21}/></button><button type="button" aria-label="Next shoe pairs" aria-controls="fresh-shoe-track" disabled={range.atEnd} onClick={()=>step(1)}><ArrowRight size={21}/></button></div></div>
  </div>;
}
