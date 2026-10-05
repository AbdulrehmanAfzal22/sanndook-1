import { supabase } from "../lib/supabase";

export function notifyWishlistChanged(userId) {
  window.dispatchEvent(new CustomEvent('soleform:wishlist', { detail: { userId } }));
}

export async function getWishlist(userId) {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, products(*, product_images(*))")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function addToWishlist(userId, productId) {
  const { error } = await supabase
    .from("wishlist_items")
    .upsert({ user_id: userId, product_id: productId }, {onConflict: 'user_id,product_id', ignoreDuplicates: true});

  if (error) throw error;
  notifyWishlistChanged(userId);
}

export async function removeFromWishlist(userId, productId) {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
  notifyWishlistChanged(userId);
}
