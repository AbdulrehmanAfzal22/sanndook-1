import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "../hooks/useQuery";
import { getProfile, updateProfile, getAddresses, addAddress, removeAddress, updateAddress } from "../services/account";
import { Loading, ErrorState } from "../components/Feedback";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Heart, LogOut, MapPin, MessageCircle, ShieldCheck, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Account() {
  const { user, admin, refresh } = useAuth();
  const navigate=useNavigate();
  const query = useQuery(
    () => user ? Promise.all([getProfile(user.id), getAddresses(user.id)]) : [null, []],
    [user?.id]
  );
  const [busy, setBusy] = useState('');
  const [feedback,setFeedback]=useState(null);
  const [addressEditor,setAddressEditor]=useState(null);

  if (query.loading && !query.data) return <Loading label="Loading your account…" />;
  if (query.error) return <ErrorState error={query.error} retry={query.refresh} />;

  const [profile, addresses] = query.data || [null, []];

  async function saveProfile(event) {
    event.preventDefault();
    setBusy('profile');setFeedback(null);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await updateProfile(user.id, { full_name: form.full_name });
      toast.success("Profile updated.");
      setFeedback({text:'Profile updated.',error:false});await query.refresh();
    } catch (error) {
      toast.error(error.message);
      setFeedback({text:error.message,error:true});
    } finally {
      setBusy('');
    }
  }

  async function saveAddress(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy('address');setFeedback(null);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if(addressEditor?.id)await updateAddress(addressEditor.id,user.id,form);
      else await addAddress({...form,user_id:user.id});
      formElement.reset();
      toast.success("Address saved.");
      setFeedback({text:'Address saved.',error:false});setAddressEditor(null);await query.refresh();
    } catch (error) {
      toast.error(error.message);
      setFeedback({text:error.message,error:true});
    } finally {
      setBusy('');
    }
  }

  async function deleteAddress(id) {
    setBusy(id);setFeedback(null);
    try {
      await removeAddress(id);
      setFeedback({text:'Address removed.',error:false});await query.refresh();
    } catch (error) {
      toast.error(error.message);
      setFeedback({text:error.message,error:true});
    }
    finally{setBusy('');}
  }

  async function signOut(){
    setBusy('signout');setFeedback(null);
    try{const {error}=await supabase.auth.signOut();if(error)throw error;await refresh();navigate('/login',{replace:true});}
    catch(error){setFeedback({text:error.message,error:true});}
    finally{setBusy('');}
  }

  return (
    <div className="page account-page account-page--premium">
      <header className="account-page__header">
        <div className="account-page__identity">
          <span className="account-page__avatar" aria-hidden="true"><UserRound size={22}/></span>
          <div><p className="account-eyebrow">SOLEFORM / YOUR SPACE</p><h1>{profile?.full_name?`Hello, ${profile.full_name.split(' ')[0]}.`:'Your next chapter.'}</h1><p>{user?.email}</p></div>
        </div>
        <span className="account-access-badge"><ShieldCheck size={15}/>{admin?'Store administrator':'Customer account'}</span>
      </header>

      <nav className="account-overview" aria-label="Account shortcuts">
        {admin&&<Link className="account-overview__admin" to="/admin"><ShieldCheck size={22}/><strong>Store studio</strong><span>Products, orders & everything in between</span><ArrowUpRight size={18}/></Link>}
        <Link to="/orders"><ShoppingBag size={22}/><strong>Your orders</strong><span>Follow every delivery</span><ArrowUpRight size={18}/></Link>
        <Link to="/wishlist"><Heart size={22}/><strong>Saved pairs</strong><span>Your next rotation</span><ArrowUpRight size={18}/></Link>
        <Link to="/exchanges"><ArrowRight size={22}/><strong>Size exchanges</strong><span>Find a better fit</span><ArrowUpRight size={18}/></Link>
      </nav>
      {feedback&&<p className={feedback.error?'error account-feedback':'notice account-feedback'} role={feedback.error?'alert':'status'}>{feedback.text}</p>}

      <section className="account-section account-profile" aria-labelledby="account-profile-title">
        <div className="account-section__heading">
          <div>
            <p className="account-eyebrow">PERSONAL DETAILS</p>
            <h2 id="account-profile-title">Profile Information</h2>
          </div>
        </div>
        <form onSubmit={saveProfile} className="account-profile__form">
          <label htmlFor="account-full-name">Full name<input id="account-full-name" name="full_name" autoComplete="name" defaultValue={profile?.full_name || ""} maxLength="150" /></label>
          <div className="account-email-field">
            <span>Email address</span>
            <p>{user?.email}</p>
          </div>
          <button className="account-primary-button" type="submit" disabled={!!busy}>{busy==='profile' ? "Saving…": "Save profile"}</button>
        </form>
      </section>

      <section className="account-section" aria-labelledby="saved-addresses-title">
        <div className="account-section__heading">
          <div>
            <p className="account-eyebrow">DELIVERY DETAILS</p>
            <h2 id="saved-addresses-title">Saved Addresses</h2>
          </div>
          <span className="account-section__count">{addresses.length} {addresses.length === 1 ? "address" : "addresses"}</span>
          <button className="account-primary-button" type="button" onClick={()=>setAddressEditor({})}>Add address <ArrowUpRight size={15}/></button>
        </div>
        {!addresses.length ? (
          <p className="account-empty-note">No saved addresses yet. Add one below for a faster checkout.</p>
        ) : (
          <div className="account-address-grid">{addresses.map((address) => (
            <article className="account-address-card" key={address.id}>
              <div className="account-address-card__top">
                <span className="account-address-card__icon"><MapPin size={17}/></span>
                <span className="account-address-card__label">{address.label || 'Address'}</span>
              </div>
              <h3>{address.full_name}</h3>
              <address>{address.line1}<br/>{address.city}{address.postal_code ? ` ${address.postal_code}` : ""}<br/>{address.country}{address.phone && <><br/>{address.phone}</>}</address>
              <div className="account-address-card__actions">
                <button type="button" disabled={!!busy} onClick={()=>setAddressEditor(address)} aria-label={`Edit ${address.label || 'saved'} address`}>Edit</button>
                <button type="button" disabled={!!busy} onClick={() => deleteAddress(address.id)} aria-label={`Remove ${address.label || 'saved'} address`}><Trash2 size={14}/> {busy===address.id?'Removing…':'Remove'}</button>
              </div>
            </article>
          ))}</div>
        )}
      </section>

      {addressEditor&&<section className="account-section account-new-address" aria-labelledby="new-address-title">
        <div className="account-section__heading">
          <div>
            <p className="account-eyebrow">A PLACE TO DELIVER</p>
            <h2 id="new-address-title">{addressEditor.id?'Edit delivery address':'Add a new address'}</h2>
          </div>
        </div>
        <form key={addressEditor.id||'new'} onSubmit={saveAddress} className="account-address-form">
          <label htmlFor="address-label">Label<input id="address-label" name="label" autoComplete="off" defaultValue={addressEditor.label||'Home'} maxLength="40"/></label>
          <label htmlFor="address-full-name">Full name<input id="address-full-name" name="full_name" autoComplete="shipping name" defaultValue={addressEditor.full_name||profile?.full_name||''} required maxLength="150"/></label>
          <label className="account-address-form__wide" htmlFor="address-line">Address<input id="address-line" name="line1" autoComplete="shipping address-line1" defaultValue={addressEditor.line1||''} required maxLength="300"/></label>
          <label htmlFor="address-city">City<input id="address-city" name="city" autoComplete="shipping address-level2" defaultValue={addressEditor.city||''} required maxLength="150"/></label>
          <label htmlFor="address-postal">Postal code<input id="address-postal" name="postal_code" autoComplete="shipping postal-code" defaultValue={addressEditor.postal_code||''} maxLength="20"/></label>
          <label htmlFor="address-country">Country<input id="address-country" name="country" autoComplete="shipping country-name" defaultValue={addressEditor.country||'Pakistan'} required maxLength="100"/></label>
          <label htmlFor="address-phone">Phone<input id="address-phone" name="phone" type="tel" autoComplete="shipping tel" defaultValue={addressEditor.phone||''} maxLength="30"/></label>
          <div className="account-address-form__actions">
            <button className="account-secondary-button" type="button" disabled={!!busy} onClick={()=>setAddressEditor(null)}>Cancel</button>
            <button className="account-primary-button" type="submit" disabled={!!busy}>{busy==='address' ? "Saving address…": "Save address"} <ArrowUpRight size={15}/></button>
          </div>
        </form>
      </section>}

      <section className="account-section account-actions" aria-labelledby="account-actions-title">
        <div className="account-section__heading">
          <div>
            <p className="account-eyebrow">YOUR SOLEFORM</p>
            <h2 id="account-actions-title">Account Actions</h2>
          </div>
        </div>
        <div className="account-actions__grid">
          {admin && <Link className="account-primary-button" to="/admin"><ShieldCheck size={17}/><span>Open Admin Dashboard</span><ArrowRight size={15}/></Link>}
          <Link className="account-secondary-button" to="/orders"><ShoppingBag size={17}/><span>My Orders</span><ArrowRight size={15}/></Link>
          <Link className="account-secondary-button" to="/wishlist"><Heart size={17}/><span>My Wishlist</span><ArrowRight size={15}/></Link>
          <Link className="account-secondary-button" to="/contact-support"><MessageCircle size={17}/><span>Contact support</span><ArrowRight size={15}/></Link>
          <Link className="account-secondary-button" to="/stock-alerts"><ShoppingBag size={17}/><span>Stock alerts</span><ArrowRight size={15}/></Link>
          <Link className="account-secondary-button" to="/reset-password?mode=forgot"><ShieldCheck size={17}/><span>Reset password</span><ArrowRight size={15}/></Link>
          <button className="account-secondary-button account-signout" type="button" disabled={!!busy} onClick={signOut}><LogOut size={17}/><span>{busy==='signout'?'Signing out…':'Sign out'}</span><ArrowRight size={15}/></button>
        </div>
      </section>
    </div>
  );
}
