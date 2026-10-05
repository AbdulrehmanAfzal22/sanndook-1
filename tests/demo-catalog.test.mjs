import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {demoProducts} from '../src/data/demoCatalog.js';
import {filterFootwear} from '../src/lib/footwear.js';
import {chooseCatalogMode,catalogModeHref} from '../src/lib/catalogMode.js';
import {previewBrands} from '../src/data/brandDirectory.js';

test('Each department has twenty different complete demo pairs',()=>{
  assert.equal(demoProducts.length,60);
  for(const department of ['men','women','kids']){
    const pairs=filterFootwear(demoProducts,new URLSearchParams({department}));
    assert.equal(pairs.length,20);
    assert.equal(new Set(pairs.map(p=>p.name)).size,20);
    assert.ok(pairs.every(p=>p.is_demo&&p.price_cents>0&&p.description.length>90&&p.product_variants.length>=5));
  }
});
test('All sixty descriptions, photos and prices are distinct',()=>{
  assert.equal(new Set(demoProducts.map(p=>p.description)).size,60);
  assert.equal(new Set(demoProducts.map(p=>p.price_cents)).size,60);
  const photos=demoProducts.map(p=>p.product_images[0]);
  assert.equal(new Set(photos.map(p=>`${p.path}:${p.demo_cell.column}:${p.demo_cell.row}`)).size,60);
  assert.ok(photos.every(p=>existsSync(new URL('../public'+p.path,import.meta.url))));
});
test('Every starter brand has a demonstration in every department',()=>{
  for(const department of ['men','women','kids']) for(const brand of previewBrands){
    assert.ok(filterFootwear(demoProducts,new URLSearchParams({department,brand:brand.name})).length>0,department+': '+brand.name);
  }
});
test('The new catalog still supports combined brand, size and department filtering',()=>{
  const params=new URLSearchParams('department=women&brand=Nike&brand=Gucci&brand=Adidas&brand=Puma&size=38&stock=1');
  const result=filterFootwear(demoProducts,params);
  assert.ok(result.length>0);
  assert.ok(result.every(p=>p.department==='women'&&['Nike','Gucci','Adidas','Puma'].includes(p.brand)));
  assert.ok(result.every(p=>p.product_variants.some(v=>v.size==='38'&&v.stock>0)));
});
test('Preview selection has explicit precedence and persists only valid modes',()=>{
  assert.equal(chooseCatalogMode({defaultMode:'demo'}),'demo');
  assert.equal(chooseCatalogMode({defaultMode:'demo',search:'?catalog=live'}),'live');
  assert.equal(chooseCatalogMode({defaultMode:'demo',remembered:'live'}),'live');
  assert.equal(chooseCatalogMode({defaultMode:'live',remembered:'demo'}),'demo');
  assert.equal(chooseCatalogMode({forcedPreview:'true',search:'?catalog=live'}),'demo');
  assert.equal(chooseCatalogMode({forcedPreview:'false',defaultMode:'demo'}),'live');
  assert.equal(chooseCatalogMode({defaultMode:'demo',search:'?catalog=unknown',remembered:'invalid'}),'demo');
});
test('Catalog switch links retain category and all selected brands',()=>{
  const link=catalogModeHref('/shop','?department=men&brand=Nike&brand=Gucci&catalog=demo','live');
  const url=new URL(link,'https://example.invalid');
  assert.equal(url.pathname,'/shop');
  assert.equal(url.searchParams.get('department'),'men');
  assert.deepEqual(url.searchParams.getAll('brand'),['Nike','Gucci']);
  assert.deepEqual(url.searchParams.getAll('catalog'),['live']);
});
test('Fresh email callbacks and admin entry points use live Auth even after demo browsing',()=>{
  for(const pathname of ['/admin','/admin/products','/login','/register','/reset-password','/account']){
    assert.equal(chooseCatalogMode({pathname,defaultMode:'demo',remembered:'demo'}),'live');
  }
  assert.equal(chooseCatalogMode({hash:'#access_token=fixture&type=recovery',defaultMode:'demo'}),'live');
  assert.equal(chooseCatalogMode({search:'?code=fixture',defaultMode:'demo'}),'live');
  assert.equal(chooseCatalogMode({pathname:'/admin',search:'?catalog=demo',defaultMode:'demo'}),'demo');
  assert.equal(chooseCatalogMode({pathname:'/login',forcedPreview:'true'}),'demo');
});
test('Copied product links resolve the right catalog in a fresh tab',()=>{
  assert.equal(chooseCatalogMode({pathname:'/product/10000000-0000-4000-8000-000000000021',remembered:'live'}),'demo');
  assert.equal(chooseCatalogMode({pathname:'/product/684197b0-500c-4443-a829-369dc4165937',defaultMode:'demo',remembered:'demo'}),'live');
  assert.equal(chooseCatalogMode({pathname:'/product/10000000-0000-4000-8000-000000000999',defaultMode:'demo'}),'live');
});
