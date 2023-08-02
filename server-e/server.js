// server.js

//tutorials:
//express: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
//sqlite3: http://www.sqlitetutorial.net/sqlite-nodejs/

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require("express"); // call express
var app = express(); // define our app using express
var bodyParser = require("body-parser");
const fs = require("fs");
const crypto = require("crypto");
const mime = require("mime");
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require("path");

const data = {
  1: "NYT.txt",
  2: "patreon.mp4",
  3: "Earth.jpg",
  4: "big.txt",
  5: "png-test.png"
};

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = 8080; // set our port

// SQLite Database Setup
const db = new sqlite3.Database('database.db');
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, fileName TEXT)');
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


// var router = express.Router();              // get an instance of the express Router
// // REGISTER OUR ROUTES -------------------------------
// // all of our routes will be prefixed with /api
// app.use('/api', router);

// ROUTES FOR OUR API
// =============================================================================
// Upload File Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  const { filename } = req.file;

  db.run('INSERT INTO files (fileName) VALUES (?)', [filename], (err) => {
    if (err) {
      console.error('Error inserting file data into the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json({ message: 'File uploaded successfully!' });
  });
});

// Download File Endpoint
app.get('/api/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error downloading the file:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// Get All Files Endpoint
app.get('/api/files', (req, res) => {
  db.all('SELECT fileName FROM files', (err, rows) => {
    if (err) {
      console.error('Error fetching files from the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const files = rows.map((row) => row.fileName);
    res.status(200).json(files);
  });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Server running on port " + port);
