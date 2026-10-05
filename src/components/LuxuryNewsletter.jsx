import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {toast} from 'sonner';
import Button from './common/Button';
import Container from './common/Container';
import Input from './common/Input';
import RevealAnimation from './RevealAnimation';

export default function LuxuryNewsletter(){
  const [email,setEmail]=useState('');
  function submit(event){event.preventDefault();toast.info('Journal sign-up is not connected yet.');}
  return <section className="home-journal" id="home-journal" aria-labelledby="home-journal-title">
    <Container width="wide" className="home-journal__inner">
      <div className="home-journal__editorial">
        <RevealAnimation className="home-journal__copy"><p className="eyebrow">Private Journal</p><h2 id="home-journal-title">Stories behind<br/>the rotation</h2><p>Discover new collections, styling inspiration and Soleform stories.</p></RevealAnimation>
        <RevealAnimation className="home-journal__image" delay={110}><img src="https://images.pexels.com/photos/8989592/pexels-photo-8989592.jpeg?auto=compress&cs=tinysrgb&w=900" alt="A woman in a refined neutral outfit with a handbag in a softly lit interior" loading="lazy" decoding="async"/></RevealAnimation>
      </div>
      <RevealAnimation as="div" className="home-journal__form-wrap" delay={180}><p className="home-journal__card-label">A note from the atelier</p><form className="home-journal__form" onSubmit={submit}><Input className="home-journal__input" type="email" name="email" label="Email address" autoComplete="email" placeholder="Your email address" required value={email} onChange={event=>setEmail(event.target.value)}/><Button variant="outline" className="home-journal__submit" type="submit">Join the journal <ArrowRight size={16}/></Button></form><p className="home-journal__privacy">Occasional letters, considered carefully.</p></RevealAnimation>
    </Container>
  </section>;
}