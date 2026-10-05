import { uuid } from '../lib/uuid';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useQuery } from '../hooks/useQuery';
import { getAddresses } from '../services/account';
import { shippingFromSavedAddress } from '../lib/shippingAddress';
import { placeOrder } from '../services/checkout';
import { Loading, ErrorState, Empty } from '../components/Feedback';
import CheckoutSteps from '../components/commerce/CheckoutSteps';
import ShippingForm from '../components/commerce/ShippingForm';
import OrderSummary from '../components/commerce/OrderSummary';
import '../styles/commerce-flow.css';
import {getStoreSettings,shippingQuote} from '../services/footwear';
import {mergeGuestBag} from '../services/guestBag';
import {addToCart} from '../services/cart';



export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useCart(user?.id);
  const settingsQuery=useQuery(getStoreSettings);
  const [importing,setImporting]=useState(true);
  const [importError,setImportError]=useState('');
  useEffect(()=>{let active=true;(async()=>{try{await mergeGuestBag(addToCart);await query.refresh();}catch(e){if(active)setImportError(e.message);toast.error(e.message);}finally{if(active)setImporting(false);}})();return()=>{active=false;};},[user?.id]);
  const addressesQuery = useQuery(() => getAddresses(user.id), [user?.id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [shipping, setShipping] = useState({ full_name: '', line1: '', city: '', postal_code: '', country: 'Pakistan', phone: '' });
  const requestId = useRef(uuid());

  if (importing || (query.loading && !query.data)) return <Loading label="Preparing checkout…" />;
  if (importError) return <div className="sf-empty"><h2>Your saved bag needs a check.</h2><p>{importError}</p><Link className="sf-button sf-button-dark" to="/cart">Review your bag</Link></div>;
  if (settingsQuery.error) return <ErrorState error={settingsQuery.error} retry={settingsQuery.refresh}/>;
  if (query.error) return <ErrorState error={query.error} retry={query.refresh} />;

  const items = query.data || [];
  const unavailable = items.some(item => !item.product_variants?.products || !item.product_variants.active || item.product_variants.stock < item.quantity);
  const subtotal = items.reduce((sum, item) => sum + (item.product_variants?.products?.price_cents || 0) * item.quantity, 0);

  const SHIPPING_CENTS=shippingQuote(subtotal,settingsQuery.data);
  if (!items.length) return <div className="page checkout-experience checkout-experience--empty"><Empty variant="premium" eyebrow="Soleform · Checkout" title="Your collection awaits." text="Choose a pair for your bag before continuing." link="/shop" action="Explore the collection"/></div>;

  function handleAddressChange(event) {
    const address = addressesQuery.data?.find(item => item.id === event.target.value);
    setSelectedAddress(event.target.value);
    setShipping(shippingFromSavedAddress(address));
  }

  function handleFieldChange(field, value) {
    setSelectedAddress('');
    setShipping(current => ({...current,[field]:value}));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const shippingAddress = { full_name: form.full_name, line1: form.line1, city: form.city, postal_code: form.postal_code, country: form.country, phone: form.phone };
    try {
      const order = await placeOrder(shippingAddress, requestId.current);
      toast.success('Order placed.');
      navigate(`/order-confirmation/${order.order_id}`);
    } catch (submitError) { setError(submitError.message); toast.error(submitError.message); }
    finally { setBusy(false); }
  }

  return <div className="page checkout-experience">
    <header className="commerce-page-header checkout-page-header"><p className="commerce-eyebrow">Soleform · A considered checkout</p><h1>Almost yours.</h1><p>Your pairs are waiting. Complete your details to place the order.</p><Link to="/cart">Return to your bag</Link></header>
    <CheckoutSteps />
    {unavailable && <p className="commerce-inline-alert" role="alert">Some pairs are unavailable. <Link to="/cart">Update your bag</Link> before placing the order.</p>}
    <div className="checkout-experience__layout">
      <form id="checkout-form" className="checkout-form-experience" onSubmit={submit}>
        <ShippingForm shipping={shipping} addresses={addressesQuery.data||[]} selectedAddress={selectedAddress} onAddressChange={handleAddressChange} onFieldChange={handleFieldChange} addressError={addressesQuery.error}/>
        {error && <p className="commerce-inline-alert commerce-inline-alert--error" role="alert">{error}</p>}
      </form>
      <OrderSummary items={items} subtotal={subtotal} shipping={SHIPPING_CENTS} unavailable={unavailable} busy={busy||settingsQuery.loading} formId="checkout-form"/>
    </div>
  </div>;
}
