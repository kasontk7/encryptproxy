// Dependencies
const request = require('request');
const http = require('http');
const { createReadStream } = require('fs');

// Start the proxy server
require('./proxy');

// Start a test origin server
const origin = http.createServer((req, res) => {
	console.log('Origin: Incoming Request Headers', req.headers);
	res.setHeader('x-hello', 'true');

	// Read a file
	const rs = createReadStream('./what.mp4');
	rs.pipe(res);
});

// Listen on port 3002
origin.listen(3002, () => {
	// Mock a frontend request: make a test request to the proxy
	request('http://localhost:3001', {
		headers: {
			'x-test': 'yes',
		}
	}, (err, res, body) => {
		if (err) throw err;
		console.log('Client: Incoming Response Headers', res.headers);
	});
});
