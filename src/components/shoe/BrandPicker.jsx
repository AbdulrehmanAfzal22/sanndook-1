import {Link} from 'react-router-dom';
import {ArrowUpRight,Check,Plus,X} from 'lucide-react';
import {selectedBrands,toggleBrand} from '../../lib/footwear';

const departments=[['men','Men'],['women','Women'],['kids','Kids']];
export default function BrandPicker({brands=[],params,onChange,compact=false}){
  const department=params.get('department')||'men',selected=selectedBrands(params);
  const eligible=brands.filter(brand=>brand.departments?.includes(department));
  const displayed=compact?eligible.slice(0,12):eligible;
  const destination=new URLSearchParams(params);destination.set('department',department);
  function changeDepartment(value){
    const next=new URLSearchParams(params);next.set('department',value);
    const allowed=brands.filter(brand=>brand.departments?.includes(value)).map(brand=>brand.name.toLowerCase());
    next.delete('brand');selected.filter(name=>allowed.includes(name.toLowerCase())).forEach(name=>next.append('brand',name));
    onChange(next);
  }
  return <div className="sf-brand-picker">
    <div className="sf-brand-picker-top"><div className="sf-department-switch" aria-label="Brand department">{departments.map(([value,label])=><button type="button" key={value} aria-pressed={department===value} onClick={()=>changeDepartment(value)}>{label}</button>)}</div><p>Pick one. Pick four. Make it yours.</p></div>
    <div className="sf-brand-grid">{displayed.map((brand,index)=>{
      const checked=selected.some(name=>name.toLowerCase()===brand.name.toLowerCase());
      return <button type="button" key={brand.id} aria-pressed={checked} aria-label={`${checked?'Remove':'Select'} ${brand.name}`} className={`sf-brand-tile ${checked?'is-selected':''} sf-wordmark-${brand.slug}`} style={{'--tile-delay':(index%6)*35+'ms'}} onClick={()=>onChange(toggleBrand(destination,brand.name))}>
        <span className="sf-brand-wordmark">{brand.name}</span><span className="sf-brand-tile-foot"><span>{department==='kids'?'Little rotations':department==='women'?"Women's edit":"Men's edit"}</span><span className="sf-brand-check">{checked?<Check size={14}/>:<Plus size={14}/>}</span></span>
      </button>;
    })}</div>
    {!displayed.length&&<div className="sf-empty"><p>New brands will appear here as the store adds them.</p></div>}
    <div className="sf-brand-selection"><div aria-live="polite"><strong>{selected.length?`${selected.length} brand${selected.length===1?'':'s'} selected`:'Your favourites, together.'}</strong><p>{selected.length?'See all your selected brands in one collection.':'Select a few brands to build your own edit.'}</p></div>
      <div className="sf-brand-selection-actions">{selected.length>0&&<button type="button" className="sf-brand-clear" onClick={()=>{const next=new URLSearchParams(destination);next.delete('brand');onChange(next);}}>Clear <X size={13}/></button>}<Link className="sf-button sf-button-dark" to={'/shop?'+destination.toString()}>{selected.length?'Shop selected brands':'Explore '+(department==='kids'?'kids':department+"’s")+' shoes'} <ArrowUpRight size={18}/></Link>{compact&&eligible.length>12&&<Link className="sf-text-link" to={'/brands?'+destination.toString()}>All {eligible.length} brands <ArrowUpRight size={15}/></Link>}</div>
    </div>
  </div>;
}
