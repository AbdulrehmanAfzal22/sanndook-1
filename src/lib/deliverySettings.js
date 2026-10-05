export const defaultSettings={shipping_fee_cents:30000,free_shipping_threshold_cents:1200000,exchange_window_days:7};
export function shippingQuote(subtotal,settings){
 const config=settings||defaultSettings;
 return subtotal>=config.free_shipping_threshold_cents?0:config.shipping_fee_cents;
}
