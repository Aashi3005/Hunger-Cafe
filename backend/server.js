// server.js
const express = require('express');
const cors = require('cors');
let sendRecipeEmail;
try {
  sendRecipeEmail = require('./emailController');
} catch (e) {
  console.error('Failed to load emailController:', e);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// POST /send-email endpoint delegates to emailController
app.post('/send-email', sendRecipeEmail);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
