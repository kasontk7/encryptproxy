var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

// Enable Cross Origin Resource Sharing so proxy server can call us
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// Shared secret is used for encryption/decryption
let sharedSecret;
var port = 8080;

// SQLite Database Setup
const db = new sqlite3.Database('database.db');
db.serialize(() => {
	// Files table will store the filenames
	db.run('CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, fileName TEXT)');
	// Initialize the database based on the current contents of the uploads folder
	// If user manually deletes files from the uploads folder, we process the changes on reboot with this function
	resetDatabaseFromUploadsFolder();
});

// ROUTES FOR OUR API
// =============================================================================

// Upload File Endpoint
app.post('/api/upload', (req, res) => {
	// Take encryption components from request in the form of buffers
	const encryptedFile = Buffer.from(req.body.data, 'base64');
	const iv = Buffer.from(req.body.iv, 'base64');
	const authTag = Buffer.from(req.body.authTag, 'base64');

	// Decrypt the incoming file using the shared secret
	const decryptedFile = decryptData(encryptedFile, iv, authTag);
	const filename = req.body.filename;
	const filePath = path.join(__dirname, 'uploads', filename);

	// Query db to check if the filename already exists in the database
	db.get('SELECT fileName FROM files WHERE fileName = ?', [filename], (err, row) => {
		if (err) {
			console.error('Error querying the database:', err);
			return res.status(500).json({ error: 'Failed to check filename in db' });
		}

		if (row) {
			// The filename already exists in the database
			return res.status(409).json({ error: 'Filename already exists in the database' });
		}

		// Write the decrypted file to disk
		fs.writeFile(filePath, decryptedFile, 'binary', (err) => {
			if (err) {
				console.error('Error writing file to disk:', err);
				return res.status(500).json({ error: 'Failed to save file' });
			}
			// Potential breakage: 
			// If program crashes at this point, file could have been written without a db write

			// Add the filename to the database
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

	// Read the requested file from disk
	fs.readFile(filePath, (err, fileContent) => {
		// Potential breakage: This does not check if the file exists in the database before trying to read it
		// If a file is deleted from disk but not removed from the database, this could result in a 500 error when trying to download
		if (err) {
			console.error('Error reading the file:', err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}

		// Encrypt the file before sending
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
	// Query all filenames from the database
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
	// This endpoint handles ECDH key exchange
	const frontendPublicKey = Buffer.from(req.body.publicKey, 'base64');
	const ecdhCurve = crypto.createECDH('secp521r1');
	ecdhCurve.generateKeys();

	// Get the backend's public key
	const backendPublicKeyBuffer = ecdhCurve.getPublicKey();

	// Compute the shared secret based on the frontend's public key and the backend's private key
	const sharedSecretKey = ecdhCurve.computeSecret(frontendPublicKey);
	sharedSecret = crypto.createHmac('sha256', sharedSecretKey).update('encryption key').digest();

	// Send the backend's public key to the frontend
	res.status(200).json({ publicKey: backendPublicKeyBuffer.toString('base64') });
});

// This function is used at startup to ensure the database reflects 
// the actual state of the uploads folder in case files were manually removed
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

// Encrypt data using AES-256-GCM
function encryptData(data, iv) {
	const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
	let encryptedData = Buffer.concat([
		cipher.update(data),
		cipher.final(),
	]);
	// AuthTag necessary for AES-256-GCM
	const authTag = cipher.getAuthTag();
	return { authTag, encryptedData };
}

// Decrypt data using AES-256-GCM
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
console.log('Server running on port ' + port);

module.exports = app;
