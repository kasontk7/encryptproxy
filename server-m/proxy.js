// Dependencies
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
var cors = require('cors');

const app = express();
app.use(cors());

const backendUrl = 'http://localhost:8080'; // Replace with the backend server URL

app.use('/api', createProxyMiddleware({ target: backendUrl, changeOrigin: true }));

const port = 3001;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});

// const http = require("http");
// const request = require('request');

// const proxyServerPort = 3001;
// const backendServerPort = 8080;

// // Create a server
// const server = http.createServer((req, res) => {
//     const backendUrl = `http://localhost:${backendServerPort}${req.url}`;
//     req.pipe(request(backendUrl)).pipe(res);
// });

// // Listen on port 3001
// server.listen(proxyServerPort);
// console.log("Server running on port " + proxyServerPort);

// module.exports = () => server.listening;
