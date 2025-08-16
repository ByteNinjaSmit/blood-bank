// test-server.js - Minimal server to test basic functionality
const express = require('express');
const app = express();

app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});