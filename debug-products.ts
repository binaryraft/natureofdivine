
import { getProducts } from './src/lib/shop-store';

async function main() {
  try {
    const products = await getProducts(false);
    console.log("Found products:", products.length);
    products.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`URL: ${p.imageUrl}`);
      console.log('---');
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
