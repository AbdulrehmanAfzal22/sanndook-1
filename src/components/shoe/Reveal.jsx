import {useEffect,useRef,useState} from 'react';

export default function Reveal({as:Tag='section',children,className='',delay=0,...props}){
  const element=useRef(null);
  const [visible,setVisible]=useState(()=>typeof IntersectionObserver==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    if(visible||!element.current)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}
    },{threshold:0.08,rootMargin:'0px 0px -24px 0px'});
    observer.observe(element.current);
    return()=>observer.disconnect();
  },[visible]);
  return <Tag ref={element} className={`sf-reveal ${visible?'is-visible':''} ${className}`} style={{'--reveal-delay':delay+'ms'}} {...props}>{children}</Tag>;
}
