import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useAuth} from '../../hooks/useAuth';
import {useQuery} from '../../hooks/useQuery';
import {getStockAlerts,removeStockAlert} from '../../services/footwear';

export default function StockAlerts({admin=false}){
 const {user}=useAuth(),q=useQuery(()=>getStockAlerts(user.id,admin),[user.id,admin]);
 async function remove(id){try{await removeStockAlert(user.id,id);await q.refresh();}catch(e){toast.error(e.message);}}
 return <section className={admin?'panel':'sf-guide'}><p className="sf-eyebrow">THE SIZE YOU'RE WAITING FOR</p><h1>{admin?'Stock alert requests':'Your stock alerts'}</h1><p>{admin?'Customers waiting for specific sizes. Review availability and reply through support.':'Your saved sizes and their current availability.'}</p><p className="muted">Alerts do not reserve a pair. Email notifications are not enabled.</p>{q.loading?<p>Loading saved sizes…</p>:q.error?<p className="error">{q.error.message}</p>:!q.data?.length?<p>No stock alerts yet. Save a sold-out size on its product page.</p>:<div className="panel table-scroll"><table><thead><tr><th>Pair</th><th>Size / colour</th><th>Availability</th>{admin&&<th>Customer</th>}<th>{admin?'Requested':'Manage'}</th></tr></thead><tbody>{q.data.map(r=>{const v=r.product_variants,p=v?.products;return <tr key={r.user_id+r.variant_id}><td>{p?<Link to={'/product/'+p.id}>{p.name}</Link>:'Pair no longer available'}</td><td>{p?.size_system} {v?.size} / {v?.color}</td><td>{v?.active&&v?.stock>0?'Back in stock':'Waiting for stock'}</td>{admin&&<td>{r.customer?.full_name}<br/><small>{r.customer?.email}</small></td>}<td>{admin?new Date(r.created_at).toLocaleDateString():<button className="text-button" onClick={()=>remove(r.variant_id)}>Remove alert</button>}</td></tr>;})}</tbody></table></div>}</section>;
}
