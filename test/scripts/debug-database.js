// Debug database connection and collections
import { MongoClient } from 'mongodb';

async function debugDatabase() {
  console.log('🔍 Debugging database connection...\n');
  
  const mongoUri = 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('\n📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // Check different possible database names
    const possibleDbs = ['rizq-ai', 'rizq_ai', 'rizqai', 'test', 'development'];
    
    for (const dbName of possibleDbs) {
      console.log(`\n🔍 Checking database: ${dbName}`);
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      console.log(`  Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
      
      if (collections.length > 0) {
        // Check users collection
        const users = db.collection('users');
        const userCount = await users.countDocuments();
        console.log(`  Users count: ${userCount}`);
        
        if (userCount > 0) {
          const allUsers = await users.find({}).toArray();
          console.log(`  Sample user:`, JSON.stringify(allUsers[0], null, 2));
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

debugDatabase();
