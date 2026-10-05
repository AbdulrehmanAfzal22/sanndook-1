import { supabase } from "../lib/supabase";

export async function getProductReviews(productId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,rating,comment,created_at")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function addReview(payload) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: payload.product_id,
      user_id: payload.user_id,
      rating: Number(payload.rating),
      comment: payload.comment.trim(),
      approved: false
    })
    .select()
    .single();

  if (error) throw new Error(error.code === '23505' ? 'You have already submitted a review for this pair.' : error.message);

  return data;
}

export async function getAverageRating(productId) {
  const reviews = await getProductReviews(productId);

  if (!reviews.length) return 0;

  return (
    reviews.reduce((sum, review) => sum + review.rating, 0) /
    reviews.length
  );
}
