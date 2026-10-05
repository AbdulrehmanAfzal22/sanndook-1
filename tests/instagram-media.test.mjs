import test from 'node:test';
import assert from 'node:assert/strict';
import {httpsMediaUrl,instagramUrl,reelShopDestination} from '../src/lib/instagramMedia.js';
test('Instagram cards only open real HTTPS Instagram URLs',()=>{
 assert.equal(instagramUrl('https://www.instagram.com/reel/test/'),'https://www.instagram.com/reel/test/');
 for(const url of ['javascript:alert(1)','https://instagram.com.attacker.test/reel/','https://user:secret@instagram.com/','//instagram.com/','http://instagram.com/'])assert.equal(instagramUrl(url),null);
});
test('Media supports HTTPS CDN URLs and rejects executable or embedded credentials',()=>{
 assert.equal(httpsMediaUrl('https://cdn.example.test/reel.mp4'),'https://cdn.example.test/reel.mp4');
 assert.equal(httpsMediaUrl('data:text/html,test'),null);assert.equal(httpsMediaUrl('https://user:secret@example.test/photo'),null);
});
test('Reel shopping preserves product destinations and blocks unsafe site paths',()=>{
 assert.equal(reelShopDestination({product_id:'29f99fd6-a827-41cc-b40b-bca6e385d779',shop_url:'/shop'}),'/product/29f99fd6-a827-41cc-b40b-bca6e385d779');
 assert.equal(reelShopDestination({shop_url:'/shop?brand=Nike&brand=Gucci'}),'/shop?brand=Nike&brand=Gucci');
 for(const shop_url of ['//attacker.test','/\\attacker.test','javascript:alert(1)'])assert.equal(reelShopDestination({shop_url}),null);
});
