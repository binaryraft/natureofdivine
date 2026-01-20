
import { db } from './src/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { merchProducts } from './src/lib/shop-seed-data';
import { v4 as uuidv4 } from 'uuid';

async function reseed() {
  const productsCollection = collection(db, 'products');
  
  console.log("Fetching existing products...");
  const snapshot = await getDocs(productsCollection);
  console.log(`Found ${snapshot.size} products. Deleting...`);
  
  for (const productDoc of snapshot.docs) {
    await deleteDoc(productDoc.ref);
  }
  
  console.log("Seeding new products...");
  for (const item of merchProducts) {
    const id = uuidv4();
    const product = {
      id,
      ...item,
      createdAt: Date.now(),
    };
    await setDoc(doc(productsCollection, id), product);
    console.log(`Added: ${item.name}`);
  }
  
  console.log("Reseed complete!");
  process.exit(0);
}

reseed().catch(err => {
  console.error(err);
  process.exit(1);
});
