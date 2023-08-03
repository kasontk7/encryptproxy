var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const fs = require("fs");
const crypto = require("crypto");
const mime = require("mime");
const sqlite3 = require('sqlite3').verbose();
const path = require("path");
const cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({limit: '50mb'}));

let sharedSecret;
var port = 8080;

// SQLite Database Setup
const db = new sqlite3.Database('database.db');
db.serialize(() => {
	db.run('CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, fileName TEXT)');
	// Initialize the database based on the current contents of the uploads folder
	// (If user manually deletes files, we don't want them to appear in db)
	resetDatabaseFromUploadsFolder();
});

// ROUTES FOR OUR API
// =============================================================================
// Upload File Endpoint
app.post('/api/upload', (req, res) => {
	const encryptedFile = Buffer.from(req.body.data, 'base64');
	const iv = Buffer.from(req.body.iv, 'base64');
	const authTag = Buffer.from(req.body.authTag, 'base64');
	const decryptedFile = decryptData(encryptedFile, iv, authTag);
	const filename = req.body.filename;
	const filePath = path.join(__dirname, "uploads", filename);
  
	// Check if the filename already exists in the database
	db.get('SELECT fileName FROM files WHERE fileName = ?', [filename], (err, row) => {
	  if (err) {
		console.error('Error querying the database:', err);
		return res.status(500).json({ error: 'Failed to check filename in db' });
	  }
  
	  if (row) {
		// The filename already exists in the database
		return res.status(400).json({ error: 'Filename already exists in the database' });
	  }
  
	  fs.writeFile(filePath, decryptedFile, 'binary', (err) => {
		if (err) {
		  console.error("Error writing file to disk:", err);
		  return res.status(500).json({ error: "Failed to save file" });
		}
		db.run('INSERT INTO files (fileName) VALUES (?)', [filename], (err) => {
		  if (err) {
			console.error('Error inserting file data into the database:', err);
			return res.status(500).json({ error: 'Failed to add file to db' });
		  }
		  res.status(200).json({ message: 'File uploaded successfully!' });
		});
	  });
	});
  });
  
// Download File Endpoint
app.get('/api/download/:fileName', (req, res) => {
	const fileName = req.params.fileName;
	const filePath = path.join(__dirname, 'uploads', fileName);

	fs.readFile(filePath, (err, fileContent) => {
		if (err) {
			console.error('Error reading the file:', err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
		const iv = crypto.randomBytes(16);
		const { authTag, encryptedData } = encryptData(fileContent, iv);

		res.status(200).json({ 
			authTag: authTag.toString('base64'),
			data: encryptedData.toString('base64'),
			iv: iv.toString('base64'),
		});
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

// Exchange Keys Endpoint
app.post('/api/exchange-keys', (req, res) => {
	const frontendPublicKey = Buffer.from(req.body.publicKey,'base64');
	const ecdhCurve = crypto.createECDH('secp521r1');
	ecdhCurve.generateKeys();
	const backendPublicKeyBuffer = ecdhCurve.getPublicKey();
	const sharedSecretKey = ecdhCurve.computeSecret(frontendPublicKey);
	sharedSecret = crypto.createHmac('sha256', sharedSecretKey).update('encryption key').digest();
	// Send the backend's public key to the frontend
	res.status(200).json({ publicKey: backendPublicKeyBuffer.toString('base64') });
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

function encryptData(data, iv) {
	const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv); 
	let encryptedData = Buffer.concat([
			cipher.update(data),
			cipher.final(),
			]);
	const authTag = cipher.getAuthTag();
	return { authTag, encryptedData };
}

function decryptData(data, iv, authTag) {
	const decipher = crypto.createDecipheriv('aes-256-gcm', sharedSecret, iv);
	decipher.setAuthTag(authTag);
	let decryptedFile = Buffer.concat([
		decipher.update(data),
		decipher.final(),
	]);
	return decryptedFile;
}

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Server running on port " + port);
