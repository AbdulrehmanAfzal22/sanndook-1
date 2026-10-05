import {categoryImageUrl,imageUrl} from './supabase';

const editorialImages=[
  'https://images.pexels.com/photos/39705623/pexels-photo-39705623.jpeg?auto=compress&cs=tinysrgb&w=1100',
  'https://images.pexels.com/photos/14801160/pexels-photo-14801160.jpeg?auto=compress&cs=tinysrgb&w=1100',
  'https://images.pexels.com/photos/34976482/pexels-photo-34976482.jpeg?auto=compress&cs=tinysrgb&w=1100'
];

export function collectionImage(category,productImage,index=0){
  if(category?.image_path)return categoryImageUrl(category.image_path);
  if(productImage?.path)return imageUrl(productImage.path);
  return editorialImages[Math.abs(index)%editorialImages.length];
}

export function collectionImageAlt(category,productImage){
  return category?.image_path?category.image_alt||category.name:productImage?.alt||`${category?.name||'Collection'} fashion edit`;
}