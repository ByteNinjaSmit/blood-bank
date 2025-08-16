// debug.js - Script to identify which module is causing the server to crash
const express = require('express');
const app = express();

app.use(express.json());

// Test importing each route file one by one
const testImports = () => {
  try {
    console.log('Testing auth-routes import...');
    const authRoutes = require('./routers/auth-routes');
    console.log('✅ auth-routes imported successfully');
    
    console.log('Testing site-routes import...');
    const siteRoutes = require('./routers/site-routes');
    console.log('✅ site-routes imported successfully');
    
    console.log('Testing donor-routes import...');
    const donorRoutes = require('./routers/donor-routes');
    console.log('✅ donor-routes imported successfully');
    
    console.log('Testing hospital-routes import...');
    const hospitalRoutes = require('./routers/hospital-routes');
    console.log('✅ hospital-routes imported successfully');
    
    console.log('Testing inventory-routes import...');
    const inventoryRoutes = require('./routers/inventory-routes');
    console.log('✅ inventory-routes imported successfully');
    
    console.log('Testing request-routes import...');
    const requestRoutes = require('./routers/request-routes');
    console.log('✅ request-routes imported successfully');
    
    console.log('Testing component-routes import...');
    const componentRoutes = require('./routers/component-routes');
    console.log('✅ component-routes imported successfully');
    
    console.log('Testing user-routes import...');
    const userRoutes = require('./routers/user-routes');
    console.log('✅ user-routes imported successfully');
    
    console.log('All route files imported successfully!');
    return true;
  } catch (error) {
    console.error('Error importing routes:', error);
    return false;
  }
};

// Run the test
testImports();

// Start a minimal server if all imports succeed
const PORT = 3002;
app.get('/', (req, res) => {
  res.json({ message: 'Debug server is working!' });
});

app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});