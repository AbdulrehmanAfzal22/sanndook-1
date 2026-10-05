import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeAdminAnalytics} from '../src/lib/adminAnalytics.js';

const variants=[{id:'size42',product_id:'pair1'},{id:'size43',product_id:'pair1'}];
const products=[{id:'pair1',name:'Orbit runner',price_cents:999999,categories:{name:'Sneakers'}}];
const item=(variant_id,quantity=1)=>({variant_id,product_name:'Original order name',unit_price_cents:500000,quantity});
const order=(id,payment_status,items=[item('size42')],date='2026-10-05T12:00:00Z')=>({id,payment_status,status:'delivered',total_cents:530000,created_at:date,order_items:items});
const options={now:new Date('2026-10-05T12:00:00Z')};
test('Paid revenue excludes unpaid and refunded orders while order counts include them',()=>{
 const result=summarizeAdminAnalytics([order('paid','paid'),order('unpaid','unpaid'),order('refund','refunded')],variants,products,options);
 assert.equal(result.totalOrders,3);assert.equal(result.completedOrders,3);assert.equal(result.revenueCents,530000);assert.equal(result.topProducts[0].value,500000);
});
test('Shoe sizes aggregate by pair using snapshot price and quantity, excluding delivery',()=>{
 const result=summarizeAdminAnalytics([order('paid','paid',[item('size42',2),item('size43')])],variants,products,options);
 assert.equal(result.topProducts.length,1);assert.deepEqual(result.topProducts[0],{label:'Orbit runner',value:1500000,quantity:3});assert.equal(result.categoryRevenue[0].value,1500000);
});
test('Sales trends include six UTC months and retain zero-sales months',()=>{
 const result=summarizeAdminAnalytics([order('april','paid',[],'2026-04-30T23:59:59Z'),order('may','paid',[],'2026-05-01T00:00:00Z'),order('october','paid',[],'2026-10-05T00:00:00Z')],[],[],options);
 assert.equal(result.monthlyRevenue.length,6);assert.equal(result.monthlyRevenue[0].value,530000);assert.equal(result.monthlyRevenue[1].value,0);assert.equal(result.monthlyRevenue[5].value,530000);assert.equal(result.revenueCents,1590000);
});
test('Archived or deleted variant references preserve historical item revenue',()=>{
 const result=summarizeAdminAnalytics([order('archived','paid',[item(null,2)])],[],[],options);
 assert.equal(result.topProducts[0].label,'Original order name');assert.equal(result.categoryRevenue[0].label,'Archived / uncategorized pairs');assert.equal(result.categoryRevenue[0].value,1000000);
});
test('A new store has honest zero metrics and no fabricated best sellers',()=>{
 const result=summarizeAdminAnalytics([],[],[],options);
 assert.equal(result.revenueCents,0);assert.equal(result.totalOrders,0);assert.deepEqual(result.topProducts,[]);assert.deepEqual(result.categoryRevenue,[]);assert.ok(result.monthlyRevenue.every(point=>point.value===0));
});
