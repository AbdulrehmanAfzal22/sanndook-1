import ProductShowcase from './ProductShowcase';

export default function NewArrivals({products=[],loading=false,error,retry}){
  return <ProductShowcase className="home-new-arrivals" products={products} loading={loading} error={error} retry={retry}/>;
}