// Original concepts for the isolated demo collection. Never seeded into
// Supabase or sent to real order APIs. Brand labels demonstrate filtering;
// these concepts are not branded merchandise offered for sale.
const concepts = {
  men: [
    ['Orbit 01','sneakers','Ivory / Lime','Synthetic leather & mesh',8450,'Ivory panels, lime accents and a sculpted sole give this everyday sneaker a fresh layered shape.'],
    ['Crimson Run','running','Crimson','Engineered knit',6290,'Crimson knit, tonal laces and a deep white midsole give this athletic runner a striking silhouette.'],
    ['Dune Court','sneakers','Tan / Cream','Synthetic leather',5490,'Warm tan panels meet a cream cupsole in a clean low court shoe with a softly padded collar.'],
    ['Midnight Low','casual','Midnight Blue','Suede & textile',5790,'Midnight-blue suede and a pale sole create a slim, softly textured casual shoe for a relaxed city rotation.'],
    ['Summit Chapter','boots','Chocolate','Leather & technical textile',10490,'Chocolate panels, metal eyelets and a padded ankle sit above a deep lug sole on this explorer boot.'],
    ['Noir Oxford','formal','Black','Polished leather',11990,'Polished black leather, closed lacing and an almond toe give this Oxford a refined special-occasion profile.'],
    ['Sage Pace','running','Sage / Cream','Suede & mesh',6790,'Soft sage overlays, cream mesh and a layered midsole give this runner a gentle retro-inspired rhythm.'],
    ['Tobacco Terrace','casual','Tobacco','Suede',8990,'Tobacco suede and a neat apron seam bring warm texture to a low-profile slip-on loafer.'],
    ['Basalt Trail','running','Charcoal','Technical mesh & synthetic',9290,'Charcoal protective overlays, a lace cage and a grooved outsole define this quiet, technical trail silhouette.'],
    ['Royal Rise','sneakers','White / Royal Blue','Synthetic leather',7790,'Royal-blue accents, a padded collar and a flat cupsole refresh this crisp white basketball-inspired high-top.'],
    ['Sandstone Boot','boots','Sand','Suede',9490,'Sandy suede, simple lacing and a crepe-style sole create a relaxed desert boot with a rounded ankle cut.'],
    ['Clay Canvas','casual','Cream / Terracotta','Canvas',4490,'Terracotta canvas is framed by a cream rubber toe and slim sole in this warm, classic low-top.'],
    ['Forest Circuit','running','Deep Forest','Mesh & synthetic',7290,'Deep-forest mesh and tonal padded panels sit above a broad cushioned sole for a grounded sporty shape.'],
    ['Merlot Derby','formal','Burgundy','Leather',10990,'Burgundy leather, open lacing and a low stacked heel add depth to a polished rounded-toe Derby.'],
    ['Ember Motion','sneakers','Grey / Orange','Mesh & synthetic',8190,'Orange accents trace sweeping grey mesh panels above a segmented sculptural sole, giving the design visible movement.'],
    ['Harbour Slip','casual','Navy','Woven textile',4990,'Navy woven textile and a pale walking sole make a simple close-fitting slip-on for an easy weekend wardrobe.'],
    ['City Chelsea','boots','Black','Leather',12990,'Black leather, elastic side panels and a chunky tread sole create a strong clean-lined Chelsea boot.'],
    ['Gumline Court','sneakers','Off White / Gum','Synthetic leather',5890,'Off-white court panels, fine perforations and a honey-coloured gum sole give this tennis-inspired low a timeless finish.'],
    ['Walnut Brogue','formal','Walnut','Leather',11490,'Walnut leather, wingtip seams and fine brogue perforations bring rich detail to a classic lace-up dress shoe.'],
    ['Lagoon Race','running','Teal','Engineered mesh',8790,'Teal mesh, a tapered heel and a curved performance-style sole give this streamlined racer a forward-moving profile.'],
  ],
  women: [
    ['Petal Step','sneakers','Blush / Cream','Synthetic leather & textile',7490,'Blush panels and a creamy sculpted sole turn rounded layered details into a soft, expressive everyday sneaker.'],
    ['Lavender Lane','running','Lavender','Technical mesh',6890,'Lavender mesh, tonal overlays and a generous white runner sole create an uplifting pastel sports silhouette.'],
    ['Peach Court','sneakers','White / Peach','Synthetic leather',5590,'Peach side and heel accents bring warmth to a crisp white court low with tidy perforations.'],
    ['Plum Street','casual','Burgundy','Suede',5990,'Burgundy suede, a rounded toe and a single neat strap give this slim Mary Jane flat a rich soft finish.'],
    ['Oat Chelsea','boots','Oatmeal','Suede',9990,'Oatmeal suede, elastic side panels and a rear pull tab balance a substantial sole on this neutral ankle boot.'],
    ['Noir Penny','formal','Black','Leather',9590,'A polished penny strap, gently squared toe and low block heel bring modern detail to a black leather loafer.'],
    ['Mint Stride','running','Mint','Engineered knit',6390,'Mint knit, matching laces and a light contrasting sole give this sporty runner a fresh airy colour story.'],
    ['Woven Day','casual','Tan','Woven textile & synthetic',4590,'Tan woven texture and a softly rounded toe create a delicate low ballet flat for sunny-day styling.'],
    ['Coral Sprint','running','Coral','Engineered mesh',8490,'Coral mesh, a narrow heel and a sweeping racing-style sole form a vibrant athletic shoe with an energetic profile.'],
    ['Navy Platform','sneakers','Navy / White','Canvas',6590,'Navy canvas, white laces and an elevated platform sole refresh a familiar high-top with strong contrast stitching.'],
    ['Olive Ascent','boots','Olive','Leather & technical textile',10790,'Olive panels, a padded ankle and deep outsole grooves give this explorer-inspired hiking boot an earthy character.'],
    ['Butter Low','sneakers','Butter Yellow','Synthetic leather',6090,'Butter-yellow panels, a creamy sole and minimal seams keep this pastel court sneaker bright and easy to style.'],
    ['Rose Alloy','running','Silver / Rose','Mesh & synthetic',7990,'Silver mesh and rose overlays add a soft shimmer to a walking shoe with a rounded cushioned sole.'],
    ['Plum Buckle','formal','Plum','Leather',9190,'Plum leather, a neat buckle and a low stacked heel bring colour to a polished softly squared loafer.'],
    ['Cloud Form','sneakers','Off White','Mesh & synthetic',8890,'Off-white flowing panels and tonal textures create depth above a chunky sculpted sole in this substantial sneaker.'],
    ['Rose Slip','casual','Dusky Pink','Canvas',4090,'Dusky-pink canvas, elastic side inserts and a white rubber sole give this low slip-on an uncomplicated everyday shape.'],
    ['Afterhours Boot','boots','Black','Leather',12490,'Black leather, tonal hardware and a tall lace-up front create a strong combat boot above a pronounced tread sole.'],
    ['Sky Court','sneakers','Pale Blue / Gum','Suede & synthetic',7090,'Pale-blue panels and a contrasting heel sit above a warm gum outsole on this slim retro court shoe.'],
    ['Caramel Oxford','formal','Caramel','Leather',10190,'Caramel leather, fine stitched seams and a modest heel give this almond-toe Oxford an understated dressy character.'],
    ['Lilac Ridge','running','Lilac / Charcoal','Technical mesh',8290,'Lilac and charcoal panels, protective overlays and a textured outsole bring adventure to a compact pastel trail shoe.'],
  ],
  kids: [
    ['Sprout Junior','sneakers','Lime / Ivory','Synthetic leather',3490,'Lime straps, ivory panels and a rounded toe make this double-fastening toddler sneaker bright and playful.'],
    ['Rocket Dash','running','Royal Blue / Orange','Mesh & synthetic',4190,'Royal-blue mesh, orange accents and a chunky white sole give this padded junior runner an energetic playground presence.'],
    ['Cherry Court','sneakers','White / Red','Synthetic leather',3790,'Cherry-red panels, tidy lacing and a flat sole turn a white classic court shape into a colourful little pair.'],
    ['Sunny Canvas','casual','Mustard','Canvas',2590,'Mustard canvas and elastic side inserts sit behind a white rubber toe on this cheerful junior slip-on.'],
    ['Scout Explorer','boots','Chestnut','Leather & textile',5795,'Chestnut panels, metal eyelets and a protective toe give this padded junior hiking boot an adventurous little shape.'],
    ['Schoolday Lace','formal','Black','Leather',3990,'Black leather, tidy seams and a rounded lace-up front keep this low-heeled junior school shoe smart and simple.'],
    ['Lilac Leap','running','Lilac','Mesh & synthetic',3690,'Lilac mesh and broad fastening straps sit above a cushioned white sole on this bright junior sports shoe.'],
    ['Cherry High','sneakers','Cherry Red','Canvas',3290,'Cherry-red canvas, white laces and contrast stitching rise above a white rubber toe in this classic junior high-top.'],
    ['Teal Tumble','running','Teal','Engineered mesh',3890,'Teal mesh, matching laces and a curved white sole give this compact junior sports sneaker a fresh colour contrast.'],
    ['Mini Harbour','sneakers','Cream / Navy','Synthetic leather',3590,'Cream panels and two navy fastening straps create a nautical little court shoe with a rounded front.'],
    ['Pebble Trail','running','Grey / Coral','Technical mesh',4890,'Grey mesh, coral accents and protective panels sit above a deeply grooved miniature trail-running outsole.'],
    ['Acorn Moc','casual','Caramel','Suede',3090,'Caramel suede and a softly stitched apron seam define a warm junior moccasin with a slim low sole.'],
    ['Park Sprout','sneakers','Emerald','Synthetic leather',3390,'Emerald panels, cream accents and easy fastening straps brighten a low playground-inspired junior sneaker.'],
    ['Schoolday Loafer','formal','Navy','Leather',4390,'A navy glossy upper, neat penny strap and low heel keep this rounded-toe junior school loafer smartly proportioned.'],
    ['Bubble Court','sneakers','Pink / White','Mesh & synthetic',4690,'Pink and white layered panels above a sculpted chunky sole give this junior sneaker a playful bubble-like silhouette.'],
    ['Sunbeam Slip','casual','Butter Yellow','Engineered knit',2890,'Butter-yellow knit, a simple pull tab and a soft white sole create a cheerful close-fitting little slip-on.'],
    ['Rainroom Junior','boots','Olive','Rubber & textile lining',4595,'An olive pull-on rain-boot concept pairs a tall smooth shaft with a pronounced tread and a simple outdoor profile.'],
    ['Skyline Junior','sneakers','Sky Blue / Gum','Synthetic leather',3995,'Sky-blue panels, white laces and a warm gum sole give this junior tennis-inspired low a crisp court finish.'],
    ['Berry Oxford','formal','Burgundy','Leather',4995,'Burgundy leather, fine perforations and a rounded lace-up front bring a special-occasion feel to this little Oxford.'],
    ['Violet Zoom','running','Purple / Turquoise','Technical mesh',4495,'Purple mesh, turquoise details and a curved white sole trace a colourful junior race sneaker full of movement.'],
  ],
};

const brands=['Nike','Adidas','Puma','New Balance','ASICS','Reebok','Converse','Vans','Skechers','Under Armour','On','HOKA','Gucci','Balenciaga','Prada','Clarks','Timberland','Crocs'];
const swatches={'Ivory':'#ece8d9','Crimson':'#c92e3d','Tan':'#c9a278','Midnight Blue':'#283b56','Chocolate':'#69462e','Black':'#242424','Sage':'#99a891','Tobacco':'#a27042','Charcoal':'#505253','White':'#f2f0e8','Sand':'#d0bb92','Cream':'#e9ddc3','Deep Forest':'#284c3b','Burgundy':'#773943','Grey':'#a1a4a5','Navy':'#263c55','Off White':'#eee9db','Walnut':'#89563b','Teal':'#278e93','Blush':'#d6a4a6','Lavender':'#a99ad2','Oatmeal':'#cabda6','Mint':'#a4cdbc','Coral':'#ec756b','Olive':'#68744e','Butter Yellow':'#ebd37f','Silver':'#c4c7ca','Plum':'#743b5f','Dusky Pink':'#c08b97','Pale Blue':'#a9cada','Caramel':'#b17e4d','Lilac':'#b5a5d8','Lime':'#abca59','Royal Blue':'#2574bb','Mustard':'#d1a22e','Chestnut':'#9b623f','Cherry Red':'#c93c45','Emerald':'#397850','Pink':'#e7b0c3','Sky Blue':'#8cbdda','Purple':'#8055a6'};
export const demoCategories=['sneakers','running','casual','boots','formal'].map((slug,i)=>({id:'20000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),name:slug[0].toUpperCase()+slug.slice(1),slug,is_accessory:false,is_active:true,display_order:i,description:'Find your next '+slug+' pair.',image_path:'/images/catalog/'+['orbit.png','crimson-runner.jpg','canvas-low.jpg','street-boot.jpg','leather-lace.jpg'][i]}));
export const demoProducts=Object.entries(concepts).flatMap(([department,rows],departmentIndex)=>rows.map(([name,category,color,material,price,description],photoIndex)=>{
 const i=departmentIndex*20+photoIndex,id='10000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),cat=demoCategories.find(c=>c.slug===category);
 const sizes=department==='kids'?['28','29','30','31','32']:department==='women'?['36','37','38','39','40']:['40','41','42','43','44','45'];
 const condition=i===0?'new':['new','new','excellent','new','premium','store_returns','new','good'][i%8],preloved=['premium','excellent','good'].includes(condition);
 const arrival=photoIndex*3+departmentIndex;
 return {id,name,is_demo:true,brand:i===0?'Soleform Studio':brands[(photoIndex+departmentIndex*5)%brands.length],category_id:cat.id,categories:cat,department,condition,price_cents:price*100,compare_at_cents:i%4===1?(price+1800+i*10)*100:null,status:'published',featured:photoIndex<7,size_system:'EU',width:i%7===0?'wide':'standard',material,
  fit_note:'Demo EU sizes illustrate the size picker. Check the brand label and foot measurements when adding real inventory.',
  condition_notes:preloved?'Illustrative preloved grade with one demo pair in a selected size. This original concept photo does not document an actual used item.':'Original concept design. Sample availability and specifications are for browsing only.',
  description:name+' — '+description+' Original demo concept; not a branded product offered for sale.',
  care:material.includes('Suede')?'For real suede pairs, use a soft suede brush and protect from moisture. Follow the care label.':material.toLowerCase().includes('leather')?'For real leather pairs, wipe with a soft cloth, use suitable care and air dry away from heat. Follow the care label.':'For real textile or synthetic pairs, brush off loose dirt, spot clean gently and air dry away from direct heat. Follow the care label.',
  created_at:new Date(Date.UTC(2026,9,5)-arrival*60000).toISOString(),
  product_images:[{id:'image-'+id,path:`/images/demo/${department}-atlas.png`,alt:`${name} — ${color}, original ${department} shoe concept`,position:0,demo_cell:{columns:5,rows:4,column:photoIndex%5,row:Math.floor(photoIndex/5)}}],
  product_variants:sizes.map((size,j)=>({id:'30000000-0000-4000-8000-'+String(i*10+j+1).padStart(12,'0'),product_id:id,size,color,color_hex:swatches[color.split('/')[0].trim()]||'#d8e99d',active:true,stock:preloved?(j===i%sizes.length?1:0):j===0?0:5})),
 };
}));
