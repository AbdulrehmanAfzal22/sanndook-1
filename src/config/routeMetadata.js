const publicRouteMetadata=[
  [/^\/brands$/,'Your brand edit','Explore shoe brands for Men, Women and Kids, together in your own edit.'],
  [/^\/stock-alerts$/,'Stock alerts','Your saved shoe sizes and their current availability.'],
  [/^\/exchanges$/,'Size exchanges','Request a size exchange for a delivered pair.'],
  [/^\/saved$/,'Saved pairs','Your favourite Soleform pairs.'],
  [/^\/size-guide$/,'Size guide','Find your shoe size and fit.'],
  [/^\/condition-guide$/,'Condition guide','Understand new and preloved shoe condition grades.'],
  [/^\/$/,'Your next rotation','Discover the latest Soleform collection.'],
  [/^\/shop$/,'Find your next pair','Explore new and preloved shoes from Soleform.'],
  [/^\/search$/,'Search','Search the Soleform collection.'],
  [/^\/collections(\/|$)/,'Collections','Explore collections from Soleform.'],
  [/^\/accessories(\/|$)/,'Accessories','Explore accessories from Soleform.'],
  [/^\/product\//,'Product','Discover a selected pair from Soleform.'],
  [/^\/about$/,'Our perspective','The point of view behind Soleform.'],
  [/^\/register$/,'Create an account','Create your Soleform account.'],
  [/^\/reset-password$/,'Choose a new password','Reset your Soleform account password.'],
  [/^\/login$/,'Sign in','Access your Soleform rotation.'],
  [/^\/auth$/,'Sign in','Access your Soleform rotation.'],
  [/^\/cart$/,'Shopping bag','Review the pairs in your Soleform bag.'],
  [/^\/checkout$/,'Checkout','Complete your Soleform order.'],
  [/^\/order-confirmation\//,'Order confirmation','Review your Soleform order confirmation.'],
  [/^\/orders$/,'Order history','Review your Soleform orders.'],
  [/^\/wishlist$/,'Wishlist','Your saved Soleform pairs.'],
  [/^\/account$/,'My account','Manage your Soleform account.'],
  [/^\/support$/,'Support','Contact Soleform customer support.'],
  [/^\/contact-support$/,'Contact Support','Contact Soleform customer support.'],
];

const privateRoute=/^\/(login|register|reset-password|auth|cart|checkout|order-confirmation|orders|stock-alerts|exchanges|wishlist|saved|account|support)(\/|$)/;

export function getStoreRouteMetadata(pathname,search=''){
  const params=new URLSearchParams(search);
  const mode=params.get('mode');
  let route=publicRouteMetadata.find(([pattern])=>pattern.test(pathname));
  if((pathname==='/reset-password'||pathname==='/login'||pathname==='/auth')&&mode==='forgot')route=[null,'Reset your password','Request a password reset for your Soleform account.'];
  if((pathname==='/login'||pathname==='/auth')&&mode==='signup')route=[null,'Create an account','Create your Soleform account.'];
  return {
    title:route?.[1]||'Page not found',
    description:route?.[2]||'The page may have moved, or the address may be incomplete.',
    noindex:!route||privateRoute.test(pathname),
  };
}
