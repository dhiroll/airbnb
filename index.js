
var express = require('express');
var serve   = require('express-static');
var app = express();
var MongoStore = require('connect-mongo');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var LocalStrategy = require('passport-local');
var uid2 = require('uid2');

var SHA256 = require("crypto-js/sha256");

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
  var salt = uid2(10);
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var biography = req.body.biography;
  var hash = SHA256(req.body.password + salt).toString(encBase64);
  
  var newUser = new Users({ 
      email: email,
      salt : salt,
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

  var user_email = req.body.email;
  var user_password = req.body.password;
  
  Users.findOne({ email: user_email }).exec(function(err, user) {

    if((SHA256(user_password + user.salt).toString(encBase64)) == user.token){
      return res.json(user);   
    }
    else res.send("not logged");
  });

});



app.get("*", function(req, res) {
  res.status(404).send("Cette route n'existe pas");
});


app.listen(3000, function() {
  console.log("Server started");
});
