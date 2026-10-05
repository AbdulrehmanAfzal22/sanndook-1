import {useState} from 'react';
import {Check,Plus,Pencil,Trash2,Tags,Search,X} from 'lucide-react';
import {toast} from 'sonner';
import {useQuery} from '../../hooks/useQuery';
import {getBrands,saveBrand,deleteBrand} from '../../services/brands';
import {brandSlug} from '../../data/brandDirectory';
import {Loading,ErrorState} from '../../components/Feedback';

const empty={name:'',slug:'',departments:['men','women','kids'],sort_order:0,is_active:true};
export default function BrandManagement(){
  const query=useQuery(()=>getBrands(true),[]),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[search,setSearch]=useState('');
  async function save(event){
    event.preventDefault();setBusy(true);
    try{await saveBrand(editing);setEditing(null);await query.refresh();toast.success('Brand saved.');}
    catch(error){toast.error(error.code==='23505'?'A brand with this name or address already exists.':error.message||'Unable to save brand.');}
    finally{setBusy(false);}
  }
  async function remove(brand){
    if(!window.confirm(`Delete ${brand.name} from the brand directory? Its shoes, stock and order history will be kept.`))return;
    setBusy(true);
    try{await deleteBrand(brand.id);await query.refresh();if(editing?.id===brand.id)setEditing(null);toast.success('Brand deleted. Its products are kept.');}
    catch(error){toast.error(error.message||'Unable to delete brand.');}
    finally{setBusy(false);}
  }
  const brands=(query.data||[]).filter(brand=>brand.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="sf-brand-admin"><div className="section-heading admin-page-heading"><div><p className="eyebrow">SHOE CATEGORIES</p><h1>Brands</h1><p className="admin-page-intro">Choose which brands appear in Men, Women and Kids. Products keep their brand label when a category is deleted.</p></div><button className="button" disabled={busy} onClick={()=>setEditing({...empty,departments:[...empty.departments],sort_order:(query.data?.length||0)*10+10})}><Plus size={16}/> Add brand</button></div>
    {editing&&<section className="panel sf-brand-editor"><div className="sf-brand-admin-row"><h2>{editing.id?'Edit brand':'A new favourite'}</h2><button type="button" disabled={busy} aria-label="Close brand editor" onClick={()=>setEditing(null)}><X size={19}/></button></div><form onSubmit={save}><div className="form-row"><label>Brand name<input required maxLength="80" value={editing.name} onChange={event=>setEditing(current=>({...current,name:event.target.value,...(!current.id?{slug:brandSlug(event.target.value)}:{})}))}/></label><label>Brand address<input required maxLength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={editing.slug} onChange={event=>setEditing(current=>({...current,slug:event.target.value}))}/></label></div><fieldset><legend>Show in these departments</legend><div className="sf-brand-admin-departments">{['men','women','kids'].map(department=><label key={department}><input type="checkbox" checked={editing.departments.includes(department)} onChange={event=>setEditing(current=>({...current,departments:event.target.checked?[...current.departments,department]:current.departments.filter(value=>value!==department)}))}/>{department[0].toUpperCase()+department.slice(1)}</label>)}</div></fieldset><div className="form-row"><label>Display order<input type="number" min="0" max="10000" step="1" required value={editing.sort_order} onChange={event=>setEditing(current=>({...current,sort_order:Number(event.target.value)}))}/></label><label className="sf-brand-admin-toggle"><input type="checkbox" checked={editing.is_active} onChange={event=>setEditing(current=>({...current,is_active:event.target.checked}))}/> Visible in store</label></div><button type="submit" className="button" disabled={busy||!editing.departments.length}><Check size={16}/>{busy?'Saving…':'Save brand'}</button></form></section>}
    <label className="sf-brand-admin-search"><Search size={17}/><input type="search" aria-label="Search brands" value={search} placeholder="Find a brand…" onChange={event=>setSearch(event.target.value)}/><span>{brands.length} brands</span></label>
    {query.loading&&!query.data?<Loading label="Loading brands…"/>:query.error?<ErrorState error={query.error} retry={query.refresh}/>:<div className="sf-brand-admin-grid">{brands.map(brand=><article className="panel" key={brand.id}><div className="sf-brand-admin-row"><span className="sf-brand-admin-icon"><Tags size={18}/></span><span className={brand.is_active?'sf-brand-status':'sf-brand-status is-hidden'}>{brand.is_active?'Visible':'Hidden'}</span></div><h2>{brand.name}</h2><p>{brand.departments.map(department=>department[0].toUpperCase()+department.slice(1)).join(' · ')}</p><div className="sf-brand-admin-row"><small>Order {brand.sort_order}</small><div><button type="button" disabled={busy} aria-label={`Edit ${brand.name}`} onClick={()=>setEditing({...brand,departments:[...brand.departments]})}><Pencil size={16}/></button><button type="button" disabled={busy} aria-label={`Delete ${brand.name}`} onClick={()=>remove(brand)}><Trash2 size={16}/></button></div></div></article>)}{!brands.length&&<p className="sf-empty">No brands here yet. Add your first favourite.</p>}</div>}
  </div>;
}
