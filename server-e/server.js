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
const cors = require('cors');

app.use(cors());

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
  // Initialize the database based on the current contents of the uploads folder
  // (We don't files to appear from last usage of db)
  resetDatabaseFromUploadsFolder();
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


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

function resetDatabaseFromUploadsFolder() {
  const uploadFolderPath = path.join(__dirname, 'uploads');

  fs.readdir(uploadFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading upload folder:', err);
      return;
    }

    db.run('DELETE FROM files', (err) => {
      if (err) {
        console.error('Error deleting data from the database:', err);
        return;
      }

      files.forEach((fileName) => {
        db.run('INSERT INTO files (fileName) VALUES (?)', [fileName], (err) => {
          if (err) {
            console.error('Error inserting file data into the database:', err);
          }
        });
      });
    });
  });
}

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Server running on port " + port);
