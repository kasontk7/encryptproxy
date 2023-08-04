const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable Cross Origin Resource Sharing (CORS)
app.use(cors());

const port = 3001;
const backendUrl = 'http://localhost:8080';

// Important that these directories physically exist before you try to write to them
const uploadsPath = path.join(__dirname, 'uploads');
const downloadsPath = path.join(__dirname, 'downloads');

// Increasing the limit of bodyParser to 50mb
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// Upload API
app.post('/api/upload', async (req, res) => {
	const { data, iv, authTag, filename } = req.body;
	try {
		// Forward the request to the backend server
		await axios.post(`${backendUrl}/api/upload`, {
			data: data,
			iv: iv,
			authTag: authTag,
			filename: filename,
		});
	} catch (error) {
		return res.status(error.response.status).json({ error: 'Failed to upload file' });
	}
	
	// Store the encrypted file in the uploads folder of /server-m
	const filePath = path.join(uploadsPath, filename);
	fs.writeFile(filePath, data, 'binary', (err) => {
		if (err) {
			console.error('Error writing file to disk:', err);
			return res.status(500).json({ error: 'Failed to save file in proxy layer' });
		}
		res.status(200).json({ message: 'Encrypted data from upload stored successfully!' });
	});
});

// Download API
app.get('/api/download/:fileName', async (req, res) => {
	const fileName = req.params.fileName;
	try {
		// Forward the request to the backend server
		const response = await axios.get(`${backendUrl}/api/download/${fileName}`);
		const { data, iv, authTag } = response.data;

		// Store the encrypted file in the downloads folder of /server-m
		const filePath = path.join(downloadsPath, fileName);
		fs.writeFile(filePath, data, 'binary', (err) => {
			if (err) {
				console.error('Error writing file to disk:', err);
				return res.status(500).json({ error: 'Failed to save file in proxy layer' });
			}
			res.status(200).json({
				authTag: authTag,
				data: data,
				iv: iv,
				message: 'Encrypted data from download stored successfully!'
			});
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to download from the backend server' });
	}
});

// Exchange Keys API
app.post('/api/exchange-keys', async (req, res) => {
	try {
		// Forward the request to the backend server
		const response = await axios.post(`${backendUrl}/api/exchange-keys`, {
			publicKey: req.body.publicKey,
		});
		// Return the public key from the backend server to the client
		res.status(200).json({ publicKey: response.data.publicKey });
	} catch (error) {
		res.status(500).json({ error: 'Failed to exchange keys with the backend server' });
	}
});

// Get Files API
app.get('/api/files', async (req, res) => {
	try {
		// Forward the request to the backend server
		const response = await axios.get(`${backendUrl}/api/files`);
		// Return the data from the backend server to the client
		res.status(200).json(response.data);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch files from the backend server' });
	}
});

// Start the server on the specified port
app.listen(port, () => {
	console.log(`Proxy server running on port ${port}`);
});

// Export the app for testing
module.exports = app;
