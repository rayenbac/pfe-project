const { MongoClient } = require('mongodb');

async function checkCollections() {
    const uri = 'mongodb+srv://rayen:rRghPcS0yAbCfa4j@goimmo.dsakui8.mongodb.net/goImmo?retryWrites=true&w=majority&appName=goImmo';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('goImmo');
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('Available collections:');
        collections.forEach(col => console.log('-', col.name));
        
        // Check each collection for property-like data
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`\n${col.name}: ${count} documents`);
            
            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log('Sample document fields:', Object.keys(sample || {}));
                
                // Check if it looks like properties
                if (sample && (sample.title || sample.price || sample.type || sample.address)) {
                    console.log('This looks like property data!');
                    console.log('Sample document:', JSON.stringify(sample, null, 2));
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkCollections();
