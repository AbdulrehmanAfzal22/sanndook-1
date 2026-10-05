import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useQuery} from '../hooks/useQuery';
import {getActiveCategories} from '../services/catalog';
import {categoryImageUrl,imageUrl} from '../lib/supabase';
import {categoriesForSection} from '../lib/categoryMatching';
import RevealAnimation from './RevealAnimation';

export const STYLE_DISCOVERY_SECTION={
  title:'Find Your Style',
  cards:[
    {id:'everyday-elegance',title:'Everyday Elegance',description:'Timeless pieces for daily dressing.',categoryLink:{section:'collections',slug:null,match:['everyday','daily','casual','essential','basics']},image:'https://images.pexels.com/photos/29814515/pexels-photo-29814515.jpeg?auto=compress&cs=tinysrgb&w=1200',imageAlt:'A woman in a refined beige outfit on a European city street'},
    {id:'occasion-wear',title:'Occasion Wear',description:'Statement pieces for special moments.',categoryLink:{section:'collections',slug:null,match:['occasion','formal','evening','party','event']},image:'https://images.pexels.com/photos/34024248/pexels-photo-34024248.jpeg?auto=compress&cs=tinysrgb&w=1200',imageAlt:'A woman in a flowing red evening gown in a softly lit theater'},
    {id:'complete-the-look',title:'Complete The Look',description:'Accessories that finish your style.',categoryLink:{section:'accessories',slug:null,match:[]},image:'https://images.pexels.com/photos/34976481/pexels-photo-34976481.jpeg?auto=compress&cs=tinysrgb&w=1200',imageAlt:'A fashion editorial flat lay with a handbag, sunglasses, and magazine'}
  ]
};

function findStyleCategory(categories,card){
  const candidates=categoriesForSection(categories,card.categoryLink.section==='accessories');
  if(card.categoryLink.slug)return candidates.find(category=>category.slug===card.categoryLink.slug)||null;
  if(card.categoryLink.section==='accessories')return candidates[0]||null;
  return candidates.find(category=>{
    const value=`${category.name||''} ${category.slug||''}`.toLowerCase();
    return card.categoryLink.match.some(keyword=>value.includes(keyword));
  })||null;
}

export default function StorySection({products=[],section=STYLE_DISCOVERY_SECTION}){
  const categoriesQuery=useQuery(()=>getActiveCategories(null),[]);
  const categories=categoriesQuery.data||[];
  const productImages=new Map();
  products.forEach(product=>{
    if(!product.category_id||productImages.has(product.category_id))return;
    const image=[...(product.product_images||[])].sort((left,right)=>left.position-right.position)[0];
    if(image)productImages.set(product.category_id,image);
  });

  return <section className="home-style-discovery" aria-labelledby="home-style-discovery-title">
    <header className="home-style-discovery__heading"><p className="eyebrow">The Soleform edit</p><h2 id="home-style-discovery-title">{section.title}</h2></header>
    <div className="home-style-discovery__grid">{section.cards.map((card,index)=>{
      const category=findStyleCategory(categories,card);
      const productImage=category&&productImages.get(category.id);
      const image=card.image||(category?.image_path?categoryImageUrl(category.image_path):productImage?imageUrl(productImage.path):null);
      const imageAlt=card.image?card.imageAlt:category?.image_path?category.image_alt||category.name:productImage?.alt||category?.name||card.imageAlt;
      const base=card.categoryLink.section==='accessories'?'/accessories':'/collections';
      const to=category?.slug?`${base}/${encodeURIComponent(category.slug)}`:base;
      return <RevealAnimation key={card.id} className="home-style-discovery__item" delay={index*100}>
        <article className="home-style-card">
          <Link className="home-style-card__image-link" to={to} aria-label={`Explore ${card.title}`}><img src={image} alt={imageAlt} loading="lazy" decoding="async"/><span className="home-style-card__shade" aria-hidden="true"/><span className="home-style-card__arrow" aria-hidden="true"><ArrowRight size={18}/></span></Link>
          <div className="home-style-card__copy"><h3>{card.title}</h3><p>{card.description}</p><Link className="home-style-card__cta" to={to}>Explore <ArrowRight size={15} aria-hidden="true"/></Link></div>
        </article>
      </RevealAnimation>;
    })}</div>
  </section>;
}