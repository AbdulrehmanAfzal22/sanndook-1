import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Instagram,ArrowUpRight,ArrowLeft,ArrowRight,Play,Pause,Heart,MessageCircle,Layers,Eye} from 'lucide-react';
import {useQuery} from '../../hooks/useQuery';
import {getInstagramFeed,getMoreInstagramReels} from '../../services/instagramReels';
import {httpsMediaUrl,instagramUrl,reelShopDestination} from '../../lib/instagramMedia';
import Reveal from './Reveal';

const comingStories=[
  {image:'/images/campaign/every-step-v3.webp',title:'Everyday, elevated.',position:'78% center'},
  {image:'/images/catalog/canvas-low.jpg',title:'Your daily rotation.'},
  {image:'/images/campaign/fresh-chapters-v3.webp',title:'A fresh perspective.',position:'64% center'},
  {image:'/images/catalog/ivory-sneaker.jpg',title:'Good pairs. Good days.'},
  {image:'/images/catalog/white-court.jpg',title:'Make it your own.'},
];

function UpcomingCard({story}){
  return <article className="sf-reel-preview"><div className="sf-reel-media">
    <img src={story.image} alt="" loading="lazy" style={{objectPosition:story.position||'center'}}/>
    <span className="sf-reel-preview-label"><Instagram size={14}/> THE NEXT CHAPTER</span>
    <span className="sf-reel-preview-title">{story.title}</span>
    <span className="sf-reel-preview-icon" aria-hidden="true"><Instagram size={19}/></span>
  </div><div className="sf-reel-preview-footer"><span>STORIES TO COME</span><span>Coming soon <Heart size={14}/></span></div></article>;
}

function useReducedMotion(){
  const [reduced,setReduced]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false);
  useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const change=()=>setReduced(media.matches);media.addEventListener?.('change',change);return()=>media.removeEventListener?.('change',change);},[]);
  return reduced;
}

function ReelCard({reel,playbackAllowed}){
  const node=useRef(null),video=useRef(null),[visible,setVisible]=useState(false),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false),[imageFailed,setImageFailed]=useState(false),[avatarFailed,setAvatarFailed]=useState(false);
  const permalink=instagramUrl(reel.permalink||reel.instagram_url),poster=httpsMediaUrl(reel.thumbnail_url),source=httpsMediaUrl(reel.media_url),avatar=httpsMediaUrl(reel.profile_image),shop=reelShopDestination(reel);
  const isReel=reel.media_type==='VIDEO',isVideo=isReel&&source,isAlbum=reel.media_type==='CAROUSEL_ALBUM';
  const image=poster||(!isReel&&source);
  const count=value=>new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value);
  useEffect(()=>{
    if(!isVideo||typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:0.55});
    if(node.current)observer.observe(node.current);return()=>observer.disconnect();
  },[isVideo]);
  useEffect(()=>{
    if(!video.current)return;
    if(playbackAllowed&&visible&&!failed){const result=video.current.play();result?.catch(()=>setPlaying(false));}
    else video.current.pause();
  },[playbackAllowed,visible,failed]);
  function togglePlayback(){
    if(!video.current)return;
    if(playing)video.current.pause();else video.current.play()?.catch(()=>setFailed(true));
  }
  if(!permalink)return null;
  return <article ref={node} className="sf-reel-card">
    <div className="sf-reel-media">
    {isVideo&&!failed?<video ref={video} src={source} poster={poster||undefined} muted playsInline loop preload="none" aria-label={reel.caption||'Instagram Reel'} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)}/>:image&&!imageFailed?<img src={image} alt={reel.caption?reel.caption.slice(0,140):'A moment from the store on Instagram'} loading="lazy" onError={()=>setImageFailed(true)}/>:<a className="sf-reel-no-image" href={permalink} target="_blank" rel="noopener noreferrer"><Instagram size={30}/><span>See this moment on Instagram <ArrowUpRight size={13}/></span></a>}
    <a className="sf-reel-author" href={permalink} target="_blank" rel="noopener noreferrer"><span className="sf-reel-avatar">{avatar&&!avatarFailed?<img src={avatar} alt="" loading="lazy" onError={()=>setAvatarFailed(true)}/>:<Instagram size={15}/>}</span><span className="sf-reel-identity"><strong>{reel.username?'@'+reel.username:'On Instagram'}</strong><span className="sf-reel-card-caption" title={reel.caption||undefined}>{reel.caption||'See this moment on Instagram.'}</span></span></a>
    <span className="sf-reel-tag">{isAlbum?<Layers size={12}/>:<Instagram size={12}/>} {isReel?'REEL':isAlbum?'PHOTO SET':'POST'}</span>
    {Number.isFinite(reel.view_count)&&<span className="sf-reel-views" aria-label={reel.view_count.toLocaleString()+' views'}><Eye size={13}/>{count(reel.view_count)} views</span>}
    <a className="sf-reel-instagram" href={permalink} target="_blank" rel="noopener noreferrer" aria-label={'View this '+(isReel?'Reel':'post')+' on Instagram'}><Instagram size={18}/></a>
    {isVideo&&!failed&&<button type="button" className="sf-reel-play" aria-label={playing?'Pause this Reel':'Play this Reel'} onClick={togglePlayback}>{playing?<Pause size={19}/>:<Play size={19}/>}</button>}
  </div><div className="sf-reel-meta"><div className="sf-reel-stats">{Number.isFinite(reel.like_count)&&<span aria-label={reel.like_count.toLocaleString()+' likes'}><Heart size={13}/>{count(reel.like_count)}</span>}{Number.isFinite(reel.comment_count)&&<span aria-label={reel.comment_count.toLocaleString()+' comments'}><MessageCircle size={13}/>{count(reel.comment_count)}</span>}</div><a className="sf-reel-open" href={permalink} target="_blank" rel="noopener noreferrer" aria-label={'Open Instagram '+(isReel?'Reel':'post')+(reel.username?' by @'+reel.username:'')}>{isReel?'Watch Reel':'View Post'} <ArrowUpRight size={13}/></a></div>
  {shop&&(shop.startsWith('/')?<Link className="sf-reel-shop" to={shop}>Shop this moment <ArrowUpRight size={15}/></Link>:<a className="sf-reel-shop" href={shop} target="_blank" rel="noopener noreferrer">Shop this moment <ArrowUpRight size={15}/></a>)}</article>;
}

export default function ShoeReels(){
  const query=useQuery(getInstagramFeed,[]),track=useRef(null),section=useRef(null),reduced=useReducedMotion();
  const [paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[visible,setVisible]=useState(false),[more,setMore]=useState([]),[nextOffset,setNextOffset]=useState(null),[loadingMore,setLoadingMore]=useState(false),[moreError,setMoreError]=useState(false),[pageVisible,setPageVisible]=useState(!document.hidden);
  useEffect(()=>{setMore([]);setNextOffset(query.data?.nextOffset??null);},[query.data]);
  useEffect(()=>{const change=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:0.15});
    if(section.current)observer.observe(section.current);return()=>observer.disconnect();
  },[]);
  const settings=query.data?.settings||{},items=[...(query.data?.reels||[]),...more].filter((item,index,all)=>instagramUrl(item.permalink||item.instagram_url)&&all.findIndex(other=>other.media_id===item.media_id)===index);
  const autoplay=Boolean(settings.autoplay_enabled)&&!paused&&!reduced&&visible&&pageVisible;
  function step(direction){
    const element=track.current;if(!element)return;
    const gap=parseFloat(window.getComputedStyle(element).columnGap)||18;
    const width=(element.firstElementChild?.getBoundingClientRect().width||250)+gap,max=Math.max(0,element.scrollWidth-element.clientWidth);
    const next=direction>0&&element.scrollLeft>=max-8?0:Math.max(0,Math.min(max,element.scrollLeft+direction*width));
    element.scrollTo?.({left:next,behavior:reduced?'instant':'smooth'});
  }
  function browseWithKeyboard(event){
    if(event.target!==event.currentTarget)return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();const element=track.current;element?.scrollTo?.({left:event.key==='Home'?0:Math.max(0,element.scrollWidth-element.clientWidth),behavior:reduced?'instant':'smooth'});}
  }
  useEffect(()=>{
    if(!autoplay||hovered||items.length<2)return;
    const timer=window.setInterval(()=>step(1),Math.max(3,Math.min(10,settings.autoplay_interval_seconds||5))*1000);
    return()=>window.clearInterval(timer);
  },[autoplay,hovered,items.length,settings.autoplay_interval_seconds,reduced]);
  async function loadMore(){
    setLoadingMore(true);setMoreError(false);
    try{const result=await getMoreInstagramReels(nextOffset);setMore(current=>[...current,...result.reels]);setNextOffset(result.nextOffset);}
    catch{setMoreError(true);}finally{setLoadingMore(false);}
  }
  const profile=instagramUrl(settings.profile_url),hasItems=items.length>0&&!query.error;
  const railProps={ref:track,role:'region',tabIndex:0,onKeyDown:browseWithKeyboard,style:{'--ig-desktop':settings.desktop_cards||5,'--ig-mobile':settings.mobile_cards||1.2}};
  return <Reveal className="sf-section sf-reels-section" id="instagram"><div ref={section}>
    <div className="sf-reels-heading"><div><p className="sf-eyebrow"><Instagram size={14}/> FROM THE COMMUNITY</p><h2>Worn & <em>Loved</em><Heart className="sf-ig-title-mark" size={25} fill="currentColor" aria-hidden="true"/></h2><p className="sf-reels-description">{settings.username?<>Discover the latest pairs, moments and styling inspiration from <a href={profile||undefined} target="_blank" rel="noopener noreferrer">@{settings.username}</a>.</>:'Good pairs. Real moments. A little everyday inspiration.'}</p></div><div className="sf-reels-heading-actions">{profile&&settings.username&&<a className="sf-reels-profile" href={profile} target="_blank" rel="noopener noreferrer">View Instagram <ArrowUpRight size={16}/></a>}<div className="sf-reels-controls">{hasItems&&settings.autoplay_enabled&&<button type="button" aria-label={paused?'Resume automatic Reel playback':'Pause automatic Reel playback'} aria-pressed={paused} onClick={()=>setPaused(current=>!current)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>}<button type="button" aria-label="Previous Instagram moments" onClick={()=>step(-1)}><ArrowLeft size={18}/></button><button type="button" aria-label="Next Instagram moments" onClick={()=>step(1)}><ArrowRight size={18}/></button></div></div></div>
    {hasItems?<><div className="sf-reels-track" {...railProps} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setHovered(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setHovered(false);}} onTouchStart={()=>setPaused(true)} aria-label="Instagram Reels and posts">{items.map(reel=><ReelCard key={reel.media_id} reel={reel} playbackAllowed={autoplay}/>)}</div>{nextOffset!==null&&<div className="sf-reels-more"><button className="sf-text-link" disabled={loadingMore} onClick={loadMore}>{loadingMore?'Loading moments…':moreError?'Try loading more again':'More moments'} <ArrowRight size={17}/></button></div>}</>:<div className="sf-reels-waiting"><div className="sf-reels-track sf-reels-preview-track" {...railProps} aria-label="Upcoming Instagram stories — decorative shoe previews">{comingStories.map(story=><UpcomingCard key={story.image} story={story}/>)}</div><div className="sf-reels-waiting-notice" role="status"><p>{query.loading?'Finding our latest moments…':query.error?'Our Instagram moments are taking a little break. Check back soon.':query.data?.connected?'New moments will appear here as the store publishes them on Instagram.':'Our Instagram Reels and posts will appear here once the store connects its account. These shoe previews are a little look at what’s to come.'}</p>{query.error&&<button type="button" className="sf-text-link" onClick={query.refresh}>Try again <ArrowRight size={16}/></button>}</div></div>}
    <div className="sf-reels-footnote"><Instagram size={15}/><span>{hasItems?'FROM OUR INSTAGRAM TO YOUR EVERYDAY':'NEW STORIES ARE ON THEIR WAY'}</span><span aria-hidden="true">✳</span></div>
  </div></Reveal>;
}
