var express = require('express');
var serve   = require('express-static');
var app = express();
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var mongoose = require("mongoose");
var passport = require('passport');
var bodyParser = require("body-parser");
var LocalStrategy = require('passport-local');
var User = require('./models/user');
var _ = require('lodash');
var salt = uid2(64);
var SHA256 = require("crypto-js/sha256");
console.log(SHA256("Message"));

var encBase64 = require("crypto-js/enc-base64");


mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/airbnb");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Activer la gestion de la session
app.use(expressSession({
  secret: 'thereactor09',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

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

app.get('/api/user/sign_up', function (req, res) {
  res.render('createUser.ejs')
});

app.post('/api/user/sign_up', function (req, res) {
  //console.log(req.body);
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var biography = req.body.biography;
  var hash = SHA256(req.body.password + salt).toString(encBase64);
 
  

  var newUser = { 
    username: username,
    email: email,
    biography: biography,
    user_id: req.user._id,
    hash: hash
  };
  
  /* announces.push(newAnnounce);  */
  var singleUser = new Users(newUser);
  
  singleUser.save(function(err, obj) {
   // console.log(obj);
    if (err) {
      console.log("something went wrong");
    } else {
      console.log("we just saved the new user ");
      res.redirect('/api/user/log_in' + singleUser._id);
    }
  });
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
