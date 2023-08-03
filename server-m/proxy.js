const express = require('express');
const bodyParser = require("body-parser");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
const port = 3001;
const backendUrl = 'http://localhost:8080';
const uploadsPath = path.join(__dirname, 'uploads');
const downloadsPath = path.join(__dirname, 'downloads');

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// Intercept the '/api/upload' endpoint
app.post('/api/upload', async (req, res) => {
	const { data, iv, authTag, filename } = req.body;
	try {
		await axios.post(`${backendUrl}/api/upload`, {
			data: data,
			iv: iv,
			authTag: authTag,
			filename: filename,
		});
		
	} catch (error) {
		return res.status(500).json({ error: 'Failed to upload file' });
	}
	// Store the encrypted file in the uploads folder
	const filePath = path.join(uploadsPath, filename);
	fs.writeFile(filePath, data, 'binary', (err) => {
		if (err) {
			console.error('Error writing file to disk:', err);
			return res.status(500).json({ error: 'Failed to save file in proxy layer' });
		}
		res.status(200).json({ message: 'Encrypted data from upload stored successfully!' });
	});
});

// Intercept the '/api/download/:fileName' endpoint
app.get('/api/download/:fileName', async (req, res) => {
	const fileName = req.params.fileName;
	const response = await axios.get(`${backendUrl}/api/download/${fileName}`);
	const { data, iv, authTag } = response.data;

	// Store the encrypted file in the downloads folder
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
});

// Intercept exchange keys
app.post('/api/exchange-keys', async (req, res) => {
	try {
		const response = await axios.post(`${backendUrl}/api/exchange-keys`, {
			publicKey: req.body.publicKey,
		});
		res.status(200).json({ publicKey: response.data.publicKey });
	} catch (error) {
		res.status(500).json({ error: 'Failed to exchange keys with the backend server' });
	}
});

// Intercept fetch files
app.get('/api/files', async (req, res) => {
	try {
		const response = await axios.get(`${backendUrl}/api/files`);
		res.status(200).json(response.data);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch files from the backend server' });
	}
});

app.listen(port, () => {
	console.log(`Proxy server running on port ${port}`);
});

