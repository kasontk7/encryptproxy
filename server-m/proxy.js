// Dependencies
const http = require("http");

// Create a server
const server = http.createServer((downstreamReq, downstreamRes) => {});

// Listen on port 3001
server.listen(3001);

module.exports = () => server.listening;
