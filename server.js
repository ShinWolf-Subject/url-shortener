const express = require('express');
const path = require('path');
const validUrl = require('valid-url');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (for demo - will reset on serverless function cold start)
// In production, use a database like MongoDB, Redis, or Vercel Postgres
let urlStorage = {};

// Helper function to generate short code
const generateShortCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Routes
app.post('/api/shorten', (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!validUrl.isUri(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Check if URL already exists
  const existingCode = Object.keys(urlStorage).find(code => urlStorage[code] === longUrl);
  if (existingCode) {
    return res.json({
      shortUrl: `${req.headers.host}/${existingCode}`,
      code: existingCode
    });
  }

  // Generate new short code
  let shortCode;
  do {
    shortCode = generateShortCode();
  } while (urlStorage[shortCode]);

  urlStorage[shortCode] = longUrl;

  res.json({
    shortUrl: `${req.headers.host}/${shortCode}`,
    code: shortCode
  });
});

app.get('/:code', (req, res) => {
  const { code } = req.params;

  if (urlStorage[code]) {
    res.redirect(urlStorage[code]);
  } else {
    // Serve the frontend for unknown routes
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.get('/api/urls', (req, res) => {
  res.json(urlStorage);
});

app.delete('/api/urls/:code', (req, res) => {
  const { code } = req.params;

  if (urlStorage[code]) {
    delete urlStorage[code];
    res.json({ message: 'URL deleted successfully' });
  } else {
    res.status(404).json({ error: 'URL not found' });
  }
});

// Root route - serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel serverless functions
module.exports = app;
