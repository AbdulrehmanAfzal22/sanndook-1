-- Optional category seed for the NEW shoe project only.
-- No demonstration products or original customer records are copied.
INSERT INTO public.categories(name,slug,description,display_order,is_accessory,is_active) VALUES
 ('Sneakers','sneakers','Everyday court and street sneakers.',1,false,true),
 ('Running','running','Running and athletic shoes.',2,false,true),
 ('Casual','casual','Easy everyday pairs.',3,false,true),
 ('Boots','boots','Boots and trail-inspired footwear.',4,false,true),
 ('Formal','formal','Leather lace-ups and occasion shoes.',5,false,true),
 ('Shoe care','shoe-care','Care products for your pairs.',6,true,true),
 ('Laces & insoles','laces-insoles','Accessories for comfort and a fresh look.',7,true,true)
ON CONFLICT(slug) DO NOTHING;
