const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/pfe_database');
    console.log('Connected to database');
    
    // Check properties collection
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));
    
    const allProperties = await Property.find({}).limit(5);
    console.log('Total properties:', await Property.countDocuments());
    console.log('Sample properties:');
    
    allProperties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.title || 'No title'} - Status: ${prop.status || 'No status'}`);
    });
    
    // Check specific status values
    const statuses = await Property.distinct('status');
    console.log('All status values:', statuses);
    
    const availableCount = await Property.countDocuments({ status: 'available' });
    console.log('Properties with status "available":', availableCount);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();
