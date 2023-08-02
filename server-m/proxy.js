// Dependencies
const http = require("http");
const request = require('request');

const proxyServerPort = 3001;
const backendServerPort = 8080;

// Create a server
const server = http.createServer((req, res) => {
    const backendUrl = `http://localhost:${backendServerPort}${req.url}`;
    req.pipe(request(backendUrl)).pipe(res);
});

// Listen on port 3001
server.listen(proxyServerPort);
console.log("Server running on port " + proxyServerPort);

module.exports = () => server.listening;
