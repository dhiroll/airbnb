
var express = require('express');
var serve   = require('express-static');
var app = express();
var MongoStore = require('connect-mongo');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var LocalStrategy = require('passport-local');
var uid2 = require('uid2');
var salt = uid2(64);
var SHA256 = require("crypto-js/sha256");
//console.log(SHA256("Message"));

var encBase64 = require("crypto-js/enc-base64");


mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/airbnb");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var userSchema = new mongoose.Schema(
{
  "account": {
    "username": String,
    "biography": String
  },
  "email": String,
  "token": String,
  "hash": String,
  "salt": String
});

var Users = mongoose.model("Users", userSchema);

app.post('/api/user/sign_up', function (req, res) {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var biography = req.body.biography;
  var hash = SHA256(req.body.password + salt).toString(encBase64);
  
  var newUser = new Users({ 
      email: email,
      token: hash,
      "account": {
        username: username,
        biography: biography
      }
    });
  
  newUser.save(function(err, obj) {
    if (!err) {
      console.log("we just saved the new user ");
      return res.json(obj); 
    }
    console.log("something went wrong");
  });
});

app.post('/api/user/log_in', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  
});

app.use("/api/user/log_in", checkAccess);
  
function preProcess(req, res, next) {
  console.log("Logged up");
  next();
}

function checkAccess(req, res, next) {
  if (req.params.username === "farid" && req.params.password === "azerty") {
    req.isAllowed = true;
    next();
  } else {
    res.send("Unauthorized");
  }
}

app.get("/:username/:password", preProcess, checkAccess, function(req, res) {
  console.log(req.isAllowed); // true
  res.send("Hello welcome");
});


app.get("*", function(req, res) {
  res.status(404).send("Cette route n'existe pas");
});


app.listen(3000, function() {
  console.log("Server started");
});
