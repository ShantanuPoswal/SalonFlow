
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function testConnection() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Successfully connected to MongoDB!");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    if (collections.some(c => c.name === 'salons')) {
        const salons = await mongoose.connection.db.collection('salons').find({}).toArray();
        console.log("Number of salons:", salons.length);
        console.log("Salons:", salons.map(s => ({ name: s.name, slug: s.slug })));
    } else {
        console.log("No 'salons' collection found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

testConnection();
