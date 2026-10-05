import {Instagram,Menu,PanelLeftClose,PanelLeftOpen,Store} from 'lucide-react';
import {Link} from 'react-router-dom';
import {adminPageTitle} from '../../config/navigation';

export default function AdminHeader({pathname,user,collapsed,onToggle,onMenu,mobileOpen}){
  const title=adminPageTitle(pathname);
  return <header className="admin-header"><div className="admin-header__left"><button type="button" className="admin-header__menu" onClick={onMenu} aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="admin-sidebar"><Menu size={19}/></button><button type="button" className="admin-header__collapse" onClick={onToggle} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} title={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><div className="admin-header__crumb"><span>Soleform</span><span aria-hidden="true">/</span><strong>{title}</strong></div></div><div className="admin-header__right"><span className="admin-live-badge">Live studio · shoe</span><span className="admin-header__user">{user?.email}</span><Link to="/shop" aria-label="View storefront"><Store size={17}/><span>Storefront</span></Link></div></header>;
}
