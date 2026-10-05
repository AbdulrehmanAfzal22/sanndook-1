import {useEffect,useState} from 'react';
import {ArrowUpRight,Check,Instagram,Link2,LoaderCircle,RefreshCw,Unplug} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useQuery} from '../hooks/useQuery';
import {useProducts} from '../hooks/useProducts';
import {connectInstagramToken,disconnectInstagram,getAdminInstagramReels,getInstagramFeedStatus,refreshInstagramFeed,saveInstagramFeedSettings,saveInstagramReelLink,startInstagramConnection} from '../services/instagramReels';
import {Empty,ErrorState,Loading} from '../components/Feedback';
import './instagram-reels.css';

const initialSettings={username:'',profile_url:'https://www.instagram.com/',reels_to_display:10,is_enabled:false,autoplay_enabled:true,autoplay_interval_seconds:3,desktop_cards:5,mobile_cards:1.2};

export default function InstagramReels(){
  const [searchParams,setSearchParams]=useSearchParams();
  const status=useQuery(getInstagramFeedStatus,[]);
  const feed=useQuery(getAdminInstagramReels,[]);
  const products=useProducts({admin:true});
  const [settings,setSettings]=useState(initialSettings);
  const [reelLinks,setReelLinks]=useState({});
  const [saving,setSaving]=useState(false);
  const [busy,setBusy]=useState('');
  const [accessToken,setAccessToken]=useState('');
  const [expiresAt,setExpiresAt]=useState('');

  useEffect(()=>{
    if(status.data?.settings)setSettings(status.data.settings);
  },[status.data]);

  useEffect(()=>{
    if(feed.data)setReelLinks(Object.fromEntries(feed.data.map(reel=>[reel.id,{product_id:reel.product_id||'',shop_url:reel.shop_url||''}])));
  },[feed.data]);

  useEffect(()=>{
    const result=searchParams.get('instagram_connection');
    if(!result)return;
    if(result==='connected')toast.success('Instagram account connected.');
    else toast.error(`Instagram connection failed: ${searchParams.get('error')||'authorization was not completed'}`);
    const next=new URLSearchParams(searchParams);
    next.delete('instagram_connection');
    next.delete('error');
    setSearchParams(next,{replace:true});
  },[searchParams,setSearchParams]);

  async function connect(){
    setBusy('connect');
    try{
      await saveInstagramFeedSettings(settings);
      const result=await startInstagramConnection(window.location.origin);
      window.location.assign(result.authorize_url);
    }catch(error){toast.error(error.message||'Could not start Instagram authorization.');setBusy('');}
  }

  async function connectToken(event){
    event.preventDefault();setBusy('token');
    let accountConnected=false;
    try{
      await saveInstagramFeedSettings({...settings,is_enabled:true});
      await connectInstagramToken(accessToken.trim(),expiresAt?new Date(expiresAt).toISOString():null);
      accountConnected=true;setAccessToken('');setExpiresAt('');
      const result=await refreshInstagramFeed();
      await Promise.all([status.refresh(),feed.refresh()]);
      toast.success(`Instagram connected. ${result.refreshed} moments synced.`);
    }catch(error){
      if(accountConnected){await Promise.all([status.refresh(),feed.refresh()]);toast.error('Account connected, but its moments could not sync. Check media permission and try Refresh Instagram Feed.');}
      else toast.error(error.message||'Unable to connect Instagram.');
    }finally{setAccessToken('');setBusy('');}
  }

  async function saveSettings(event){
    event.preventDefault();
    setSaving(true);
    try{
      await saveInstagramFeedSettings(settings);
      await status.refresh();
      toast.success('Instagram feed settings saved.');
    }catch(error){toast.error(error.message||'Unable to save Instagram settings.');}
    finally{setSaving(false);}
  }

  async function refresh(){
    setBusy('refresh');
    try{
      const result=await refreshInstagramFeed();
      await Promise.all([status.refresh(),feed.refresh()]);
      toast.success(`Feed refreshed: ${result.refreshed} moments found.`);
    }catch(error){toast.error(error.message||'Unable to refresh the Instagram feed.');}
    finally{setBusy('');}
  }

  async function disconnect(){
    if(!window.confirm('Disconnect the Instagram account? Cached Reels and posts will be hidden from the storefront.'))return;
    setBusy('disconnect');
    try{
      await disconnectInstagram();
      await Promise.all([status.refresh(),feed.refresh()]);
      toast.success('Instagram account disconnected.');
    }catch(error){toast.error(error.message||'Unable to disconnect Instagram.');}
    finally{setBusy('');}
  }

  async function saveReelLink(reel){
    const link=reelLinks[reel.id]||{product_id:'',shop_url:''};
    setBusy(reel.id);
    try{
      await saveInstagramReelLink(reel.id,{product_id:link.product_id||null,shop_url:link.shop_url.trim()||null});
      await feed.refresh();
      toast.success('Instagram shop destination saved.');
    }catch(error){toast.error(error.message||'Unable to save the Instagram shop destination.');}
    finally{setBusy('');}
  }

  const connected=status.data?.connected===true;
  const environmentManaged=status.data?.connection_source==='environment';

  return <div className="admin-instagram-reels">
    <div className="section-heading admin-page-heading"><div><p className="eyebrow">STOREFRONT CONTENT</p><h1>Instagram Feed</h1><p className="admin-page-intro">Connect your store account to display its Reels, photos and posts on the homepage.</p></div><a className="button outline" href={settings.profile_url||'https://www.instagram.com/'} target="_blank" rel="noreferrer">Open Instagram <ArrowUpRight size={15}/></a></div>
    {status.loading&&!status.data?<Loading label="Checking Instagram connection…"/>:status.error?<ErrorState error={status.error} retry={status.refresh}/>:<>
      <section className="admin-ig-connection panel" aria-labelledby="admin-ig-connection-title">
        <div className="admin-ig-connection__identity"><span className="admin-ig-connection__icon"><Instagram size={20}/></span><div><p className="eyebrow">INSTAGRAM LOGIN</p><h2 id="admin-ig-connection-title">{connected?`Connected as @${status.data.username}`:'Connect your store account'}</h2><p>{connected?`Last synced ${status.data.last_synced_at?new Date(status.data.last_synced_at).toLocaleString():'not yet synced'}.`:'The official Instagram API connection is required to populate the live Reel feed.'}</p></div></div>
        <div className="admin-ig-connection__actions">{connected?<><button className="button" type="button" disabled={Boolean(busy)} onClick={refresh}><RefreshCw size={15}/>{busy==='refresh'?'Refreshing…':'Refresh Instagram Feed'}</button>{!environmentManaged&&<button className="button outline" type="button" disabled={Boolean(busy)} onClick={disconnect}><Unplug size={15}/>{busy==='disconnect'?'Disconnecting…':'Disconnect'}</button>}</>:<button className="button" type="button" disabled={Boolean(busy)||!status.data.meta_configured} onClick={connect}><Link2 size={15}/>{busy==='connect'?'Connecting…':'Connect Instagram'}</button>}</div>
        {environmentManaged?<p className="admin-ig-connection__notice" role="status">Connected through the server environment. To replace the account, update INSTAGRAM_ACCESS_TOKEN in your shoe project's Edge Function Secrets. Set INSTAGRAM_FEED_ENABLED=false there to hide the feed. Layout, playback and shop links remain editable below.</p>:!status.data.meta_configured&&<p className="admin-ig-connection__notice" role="status">Connect with your Instagram access token below, or add INSTAGRAM_ACCESS_TOKEN in your shoe project's Edge Function Secrets. Account authorization is also available when your Meta app is configured.</p>}
        {!environmentManaged&&<form className="sf-ig-token-form" onSubmit={connectToken} autoComplete="off"><h3>{connected?'Update your access token':'Connect with an access token'}</h3><p>Enter your Instagram username in Feed configuration, then use a token for that same Business or Creator account. Your latest Reels, photos and posts will sync to the homepage.</p><label>Instagram access token<input type="password" autoComplete="new-password" spellCheck="false" minLength="20" maxLength="4096" required value={accessToken} onChange={event=>setAccessToken(event.target.value)} placeholder="Paste your Instagram access token"/><small>The token stays on the server and is cleared from this form after connecting.</small></label><label>Token expiry · optional<input type="datetime-local" value={expiresAt} onChange={event=>setExpiresAt(event.target.value)}/><small>Leave blank if you don't know the expiry. You can replace an expired token here.</small></label><button className="button" type="submit" disabled={Boolean(busy)||saving||!settings.username||!accessToken.trim()}><Link2 size={15}/>{busy==='token'?'Connecting and syncing…':connected?'Update token & sync':'Connect token & sync'}</button></form>}
      </section>
      <section className="panel admin-ig-settings" aria-labelledby="admin-ig-settings-title"><h2 id="admin-ig-settings-title">Feed configuration</h2>
        <form onSubmit={saveSettings}>
          <label>Instagram username<input value={settings.username} disabled={environmentManaged} onChange={event=>setSettings(current=>({...current,username:event.target.value.replace(/^@/, '')}))} required maxLength="30" pattern="[A-Za-z0-9._]{1,30}"/></label>
          <label>Instagram profile URL<input type="url" value={settings.profile_url} disabled={environmentManaged} onChange={event=>setSettings(current=>({...current,profile_url:event.target.value}))} required/></label>
          <label>Maximum moments to cache<input type="number" min="1" max="50" step="1" value={settings.reels_to_display} onChange={event=>setSettings(current=>({...current,reels_to_display:Number(event.target.value)}))}/><small>Newest posts and Reels first; paged in groups of 12.</small></label>
          <label>Autoplay interval<select value={settings.autoplay_interval_seconds} onChange={event=>setSettings(current=>({...current,autoplay_interval_seconds:Number(event.target.value)}))}><option value="3">3 seconds</option><option value="4">4 seconds</option><option value="5">5 seconds</option><option value="6">6 seconds</option><option value="8">8 seconds</option><option value="10">10 seconds</option></select></label>
          <label>Desktop cards per view<select value={settings.desktop_cards} onChange={event=>setSettings(current=>({...current,desktop_cards:Number(event.target.value)}))}><option value="4">4 cards</option><option value="5">5 cards</option></select></label>
          <label>Mobile cards per view<select value={settings.mobile_cards} onChange={event=>setSettings(current=>({...current,mobile_cards:Number(event.target.value)}))}><option value="1">1 card</option><option value="1.2">1.2 cards</option><option value="1.5">1.5 cards</option><option value="2">2 cards</option></select></label>
          <label className="admin-ig-settings__toggle"><input type="checkbox" checked={settings.is_enabled} disabled={environmentManaged} onChange={event=>setSettings(current=>({...current,is_enabled:event.target.checked}))}/> Feed enabled{environmentManaged?' · managed by server environment':''}</label>
          <label className="admin-ig-settings__toggle"><input type="checkbox" checked={settings.autoplay_enabled} onChange={event=>setSettings(current=>({...current,autoplay_enabled:event.target.checked}))}/> Autoplay enabled</label>
          <div className="admin-ig-settings__actions"><button className="button" type="submit" disabled={saving}>{saving?<LoaderCircle size={15} className="is-spinning"/>:<Check size={15}/>} {saving?'Saving…':'Save settings'}</button></div>
        </form>
      </section>
    </>}
    <section className="admin-reel-list" aria-labelledby="admin-reel-list-title"><div className="admin-reel-list__heading"><h2 id="admin-reel-list-title">Synced Reels & posts</h2><span>{feed.data?.length||0} shown · newest first</span></div>
      {feed.loading&&!feed.data?<Loading label="Loading synced Reels…"/>:feed.error?<ErrorState error={feed.error} retry={feed.refresh}/>:!feed.data?.length?<Empty title="No Instagram moments synced" text="Connect Instagram and refresh the feed. The storefront will remain on its Instagram follow fallback until then." link={null} action={null}/>:<div className="admin-reel-list__items">{feed.data.map(reel=><article className="admin-reel-row" key={reel.id}>
        <div className="admin-reel-row__thumb">{reel.thumbnail_url?<img src={reel.thumbnail_url} alt="" loading="lazy"/>:<Instagram size={20}/>}</div>
        <div className="admin-reel-row__info"><strong>{reel.published_at?new Date(reel.published_at).toLocaleString():'Instagram Reel'}</strong><span>@{reel.username} · {reel.media_type||'VIDEO'}{reel.view_count!==null?` · ${Number(reel.view_count).toLocaleString()} views`:''}{reel.like_count!==null?` · ${Number(reel.like_count).toLocaleString()} likes`:''}{reel.comment_count!==null?` · ${Number(reel.comment_count).toLocaleString()} comments`:''}</span><span>{reel.caption||'No caption added'}</span>
          <div className="admin-reel-row__link-editor"><label>Shop product<select value={reelLinks[reel.id]?.product_id||''} onChange={event=>setReelLinks(current=>({...current,[reel.id]:{...current[reel.id],product_id:event.target.value}}))}><option value="">No product</option>{(products.data||[]).filter(product=>product.status==='published').map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Or collection / shop URL<input value={reelLinks[reel.id]?.shop_url||''} onChange={event=>setReelLinks(current=>({...current,[reel.id]:{...current[reel.id],shop_url:event.target.value}}))} placeholder="/collections/sneakers"/></label><button className="button outline" type="button" disabled={busy===reel.id} onClick={()=>saveReelLink(reel)}>{busy===reel.id?'Saving…':'Save shop link'}</button></div>
        </div>
        <div className="admin-reel-row__actions"><a href={reel.instagram_url} target="_blank" rel="noreferrer">Open Instagram <ArrowUpRight size={14}/></a></div>
      </article>)}</div>}
    </section>
  </div>;
}
