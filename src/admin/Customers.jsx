import { useQuery } from "../hooks/useQuery";
import { getCustomers,getCustomerById } from "../services/customers";
import {useState} from 'react';
import { Loading, ErrorState, Empty } from "../components/Feedback";
import DataTable from "../components/admin/DataTable";
import {money} from '../lib/supabase';

export default function Customers() {
  const query = useQuery(getCustomers);
  if (query.loading && !query.data) return <Loading label="Loading customers…" />;
  if (query.error) return <ErrorState error={query.error} retry={query.refresh} />;
  const customers = query.data || [];
  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (customer) => (
        <div className="admin-customer-cell">
          <span>{(customer.full_name || "M").slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{customer.full_name || "Unnamed customer"}</strong>
            <small>Soleform customer</small>
          </div>
        </div>
      ),
    },
    { key: "orders", label: "Orders", numeric: true, render: (customer) => customer.orders?.length || 0 },
    {key:'email',label:'Email',render:customer=>customer.email||'—'},
    {
      key: "spent",
      label: "Order value",
      numeric: true,
      render: (customer) => {
        const total = customer.orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0);
        return total ? money(total) : "-";
      },
    },
    {
      key: "activity",
      label: "Last activity",
      render: (customer) => {
        const latest = [...(customer.orders || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];
        return latest ? (
          <time dateTime={latest.created_at}>{new Date(latest.created_at).toLocaleDateString()}</time>
        ) : "No orders yet";
      },
    },
    {key:'details',label:'Details',render:customer=><CustomerDetails customer={customer}/>},
  ];
  return (
    <>
      <div className="section-heading admin-page-heading">
        <div>
          <p className="eyebrow">RELATIONSHIPS</p>
          <h1>Customers</h1>
          <p className="admin-page-intro">Customer profiles and order activity.</p>
        </div>
      </div>
      {customers.length ? (
        <DataTable
          caption="Customers"
          columns={columns}
          rows={customers}
          rowKey={(customer) => customer.id}
          empty="No customer records."
        />
      ) : (
        <Empty title="No customers yet" action={null} />
      )}
    </>
  );
}

function CustomerDetails({customer}){
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function load(event){
    if(!event.currentTarget.open||data||busy)return;
    setBusy(true);setError('');
    try{setData(await getCustomerById(customer.id));}
    catch(error){setError(error.message);}
    finally{setBusy(false);}
  }
  return <details className="admin-customer-details" onToggle={load}><summary>View customer</summary><div className="admin-customer-details__panel">
    {busy?<p role="status">Loading customer details…</p>:error?<p className="error" role="alert">{error}</p>:data&&<><h3>Delivery addresses</h3>{data.addresses.length?data.addresses.map(address=><address key={address.id}><strong>{address.label} · {address.full_name}</strong><br/>{address.line1}<br/>{address.city} {address.postal_code}<br/>{address.country}{address.phone&&<><br/>{address.phone}</>}</address>):<p>No saved delivery addresses.</p>}<h3>Order history</h3>{data.orders.length?data.orders.map(order=><p key={order.id}><strong>#{order.order_number}</strong> · {order.status} · {money(order.total_cents)}</p>):<p>No orders yet.</p>}</>}
  </div></details>;
}
