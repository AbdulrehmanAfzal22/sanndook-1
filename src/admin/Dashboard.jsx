import { useQuery } from "../hooks/useQuery";
import { getDashboardMetrics } from "../services/dashboard";
import { Loading, ErrorState } from "../components/Feedback";
import { money } from "../lib/supabase";
import {Boxes,CircleAlert,DollarSign,Package,ShoppingCart,Users} from 'lucide-react';
import MetricCard from '../components/admin/MetricCard';
import ChartCard from '../components/admin/ChartCard';
import {Link} from 'react-router-dom';

export default function Dashboard() {
  const q = useQuery(() => getDashboardMetrics());

  if (q.loading && !q.data) return <Loading label="Loading dashboard…" />;
  if (q.error) return <ErrorState error={q.error} retry={q.refresh} />;
  const m = q.data;

  return (
    <>
      <div className="section-heading"><div><p className="eyebrow">YOUR STORE, IN FOCUS</p><h1>Good pairs. Great business.</h1><p className="admin-page-intro">Your live Soleform store, from the first listing to the next delivery.</p></div><Link className="button" to="/admin/products/create">Add a pair ↗</Link></div>
      <div className="admin-metrics-grid">
        <MetricCard label="Paid revenue" value={money(m.revenueCents)} detail="Recorded payments" Icon={DollarSign}/>
        <MetricCard label="Orders" value={m.orders} detail="All order statuses" Icon={ShoppingCart} href="/admin/orders"/>
        <MetricCard label="Customers" value={m.customers} detail="Registered profiles" Icon={Users} href="/admin/customers"/>
        <MetricCard label="Products" value={m.products} detail="Catalog records" Icon={Package} href="/admin/products"/>
        <MetricCard label="Inventory units" value={m.inventory} detail="Active variant stock" Icon={Boxes} href="/admin/inventory"/>
        <MetricCard label="Inventory alerts" value={m.lowStock+m.outOfStock} detail={`${m.lowStock} low stock · ${m.outOfStock} sold out`} Icon={CircleAlert} href="/admin/inventory"/>
      </div>
      <nav className="admin-quick-actions" aria-label="Store shortcuts"><Link to="/admin/inventory">Update size stock ↗</Link><Link to="/admin/orders">Manage orders ↗</Link><Link to="/admin/support">Customer conversations ↗</Link><Link to="/admin/instagram-reels">Connect Instagram ↗</Link></nav>
      <div className="admin-chart-grid admin-dashboard-charts"><ChartCard title="Operations at a glance" description="Current records in your connected store." series={[{label:'Products',value:m.products},{label:'Customers',value:m.customers},{label:'Orders',value:m.orders}]}/><ChartCard title="Inventory attention" description="Active shoe sizes and colours. Low stock means 1–5 pairs." series={[{label:'Ready to sell',value:m.healthyStock},{label:'Low stock',value:m.lowStock},{label:'Sold out',value:m.outOfStock}]}/></div>
    </>
  );
}
