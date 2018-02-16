var express = require('express');
var serve = require('express-static');
var app = express();
var MongoStore = require('connect-mongo');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var LocalStrategy = require('passport-local');
var uid2 = require('uid2');
var multer = require("multer");
var upload = multer({
  dest: "public/uploads/"
});

var SHA256 = require("crypto-js/sha256");

var encBase64 = require("crypto-js/enc-base64");


mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/airbnb");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

var userSchema = new mongoose.Schema({
  "account": {
    "username": String,
    "biography": String
  },
  "email": String,
  "token": String,
  "hash": String,
  "salt": String,
  "rooms": [{
    "type": mongoose.Schema.Types.ObjectId,
    "ref": "Room"
  }]
});

var roomSchema = new mongoose.Schema({
  "title": String,
  "description": String,
  "photos": [String],
  "price": Number,
  "ratingValue": Number,
  "reviews": Number,
  "city": String,
  "loc": {
    "type": [Number], // Longitude et latitude
    "index": "2d" // Créer un index geospatial https://docs.mongodb.com/manual/core/2d/
  },
  "user": {
    "type": mongoose.Schema.Types.ObjectId,
    "ref": "User"
  }
});

var Users = mongoose.model("Users", userSchema);
var Rooms = mongoose.model("Rooms", roomSchema);

app.post('/api/user/sign_up', function (req, res) {

  console.log("hello");
  var username = req.body.username;
  var biography = req.body.biography;
  var email = req.body.email;
  var password = req.body.password;
  var salt = uid2(10);
  var hash = SHA256(req.body.password + salt).toString(encBase64);
  var photos = req.body.photos;

  var newUser = new Users({
    email: email,
    salt: salt,
    token: hash,
    "account": {
      username: username,
      biography: biography
    }
  });

  newUser.save(function (err, userObj) {
    if (!err) {
      console.log("we just saved the new user ");
      return res.json(userObj);
    }
    console.log("something went wrong");
  });
});

function getUser(req, res, next) {
  var auth = req.headers.authorization;
  var token = auth.split(" ")[1];
  Users.findOne({
    token: token
  }, function (err, user) {
    if (user) {
      req.user_id = user._id;
      req.username = user.account.username;
      next();
    } else {
      res.json({
        message: "No user found"
      })
    }
  });
}


app.post('/api/room/publish', getUser, function (req, res) {
  console.log("user_id", req.user_id)

  var title = req.body.title;
  var description = req.body.description;
  var ratingValue = req.body.ratingValue;
  var reviews = req.body.reviews;
  var photos = req.body.photos;
  var price = req.body.price;
  var city = req.body.city;
  var loc = req.body.loc;

  var newRoom = new Rooms({
    title: title,
    description: description,
    photos: photos,
    price: price,
    reviews: reviews,
    ratingValue: ratingValue,
    city: city,
    loc: loc,
    user: req.user_id
  });
  newRoom.save(function (err, obj) {
    if (!err) {
      console.log("we just saved the new room ");
      return res.json(obj);
    }
    console.log("something went wrong");
  });
});


app.post('/api/user/log_in', function (req, res) {

  var user_email = req.body.email;
  var user_password = req.body.password;

  Users.findOne({
    email: user_email
  }).exec(function (err, user) {
    if ((SHA256(user_password + user.salt).toString(encBase64)) == user.token) {
      return res.json(user);
    } else res.send("not logged");
  });

});



app.get("/api/user/:id", function (req, res) {
  var id = req.params.id;
  console.log(id);
  var user_token = req.headers.authorization;
  console.log(user_token);
  Users.findOne({
    _id: id
  }).exec(function (err, user) {
    console.log(user.token);
    if (user_token == ('Bearer ' + user.token)) {
      return res.json(user);
    } else return res.send("Unauthorized");
  });
});

app.get("*", function (req, res) {
  res.status(404).send("Cette route n'existe pas");
});


app.listen(3000, function () {
  console.log("Server started");
});