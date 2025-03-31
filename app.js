const express = require('express');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Google Sheet information
const SHEET_ID = "1L2rmaklLE-NFDdGNbQqkiHnJPCe08qguo2tEOX5oaNY";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Function to fetch data from Google Sheet
async function fetchGoogleSheet() {
  try {
    const response = await axios.get(CSV_URL);
    const dataStream = Readable.from(response.data);
    return new Promise((resolve, reject) => {
      let rows = [];
      dataStream
        .pipe(csv())
        .on("data", (row) => {
          rows.push(row);
        })
        .on("end", () => {
          resolve(rows);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw error;
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const data = await fetchGoogleSheet();
    res.render('index', { 
      title: 'Real-Time Data Dashboard',
      data: data,
      lastRecord: data[data.length - 1],
      previousRecord: data[data.length - 2] || {}
    });
  } catch (error) {
    res.render('index', { 
      title: 'Real-Time Data Dashboard',
      error: 'Failed to fetch data',
      data: [],
      lastRecord: {},
      previousRecord: {}
    });
  }
});

// API endpoint to get all data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchGoogleSheet();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// API endpoint to get last 10 records
app.get('/api/recent', async (req, res) => {
  try {
    const data = await fetchGoogleSheet();
    const recentData = data.slice(-10);
    res.json(recentData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Start server only if running locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export app for Vercel
module.exports = app;
