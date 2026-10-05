import { useQuery } from "../hooks/useQuery";
import { getAnalytics } from "../services/analytics";
import { Loading, ErrorState } from "../components/Feedback";
import { money } from "../lib/supabase";
import MetricCard from '../components/admin/MetricCard';
import ChartCard from '../components/admin/ChartCard';
import {CheckCircle2,DollarSign,ShoppingBag} from 'lucide-react';

export default function Analytics() {
  const q = useQuery(() => getAnalytics());

  if (q.loading && !q.data) return <Loading label="Loading analytics…" />;
  if (q.error) return <ErrorState error={q.error} retry={q.refresh} />;
  const data = q.data;
  const currencySeries=series=>series.map(point=>({...point,display:money(point.value)}));

  return (
    <>
      <div className="section-heading"><div><p className="eyebrow">PERFORMANCE</p><h1>Analytics</h1><p className="admin-page-intro">Recorded commerce activity across the store.</p></div></div>
      <div className="admin-metrics-grid admin-metrics-grid--analytics"><MetricCard label="Paid revenue" value={money(data.revenueCents)} detail="Recorded payments" Icon={DollarSign}/><MetricCard label="Orders" value={data.totalOrders} detail="All statuses" Icon={ShoppingBag}/><MetricCard label="Delivered" value={data.completedOrders} detail="Completed orders" Icon={CheckCircle2}/></div>
      <div className="admin-chart-grid"><ChartCard title="Order completion" description="Delivered orders compared with all other recorded statuses." series={[{label:'Delivered',value:data.completedOrders},{label:'Other statuses',value:Math.max(0,data.totalOrders-data.completedOrders)}]}/><ChartCard title="Sales trends" description="Paid order revenue over the last six months, including delivery." series={currencySeries(data.monthlyRevenue)}/><ChartCard title="Top pairs" description="Paid item revenue at the price recorded on each order. Delivery excluded." series={currencySeries(data.topProducts)} emptyMessage="No paid shoe sales yet. Your best-selling pairs will appear here."/><ChartCard title="Collection performance" description="Paid item revenue grouped by the current shoe collection. Delivery excluded." series={currencySeries(data.categoryRevenue)} emptyMessage="No paid collection sales yet."/></div>
    </>
  );
}
