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
var path = require("path");

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

var port = process.env.PORT || 8080; // set our port

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Server running on port " + port);
