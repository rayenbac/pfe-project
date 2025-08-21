import mongoose from 'mongoose';
import { Property } from '../Models/property';
import '../Config/db.config'; // This will establish the connection
import fs from 'fs';
import path from 'path';

async function addTestProperties() {
  try {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Connected to database');

    // Read test properties data
    const testPropertiesPath = path.join(__dirname, '../../../test-properties.json');
    const testPropertiesData = JSON.parse(fs.readFileSync(testPropertiesPath, 'utf8'));

    // Clear existing properties (optional)
    await Property.deleteMany({});
    console.log('Cleared existing properties');

    // Insert test properties
    const insertedProperties = await Property.insertMany(testPropertiesData);
    console.log(`Inserted ${insertedProperties.length} test properties`);

    // Display summary
    console.log('\nProperty Summary:');
    for (const property of insertedProperties) {
      console.log(`- ${property.title} (${property.type}) - ${property.address.city}, ${property.address.state}`);
    }

  } catch (error) {
    console.error('Error adding test properties:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

addTestProperties();
