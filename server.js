"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");
const returnMenu = require("./routes/returnMenu");

const makeFoodOrder = require("./routes/makeFoodOrder.js")

const sendReadySMS = require("./routes/twilio_cready.js")
const sendTimeSMS = require("./routes/twilio_ctime.js")


// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));
// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

// Home page

app.get("/", (req, res) => {
    let templateVars = {
    	foodEntree: returnMenu.catOne,
      foodSnack: returnMenu.catTwo,
      foodDrink: returnMenu.catThree,
    };
    console.log(returnMenu.catThree);
    res.render("index", templateVars);
});

//Ordering food
app.get("/order", (req, res) => {

  let food_id = req.body.food_id;
  let food_quantity = req.body.food_quantity;

  // makeFoodOrder(order_id, food_id, food_quantity)
  makeFoodOrder('temporary', '3', '2');

  let templateVars = {
      food_status: returnMenu.catThree,
    };
    res.render("index", templateVars);
});


app.post("/confirm", (req, res) => {


});

app.post("/sms", (req, res) => {
  const twiml = new MessagingResponse();
  let timeResponse = req.body.Body.slice(0, 2)
  let readyResponse = req.body.Body.slice(0, 5)
  if (readyResponse == 'Ready') {
    console.log("the food is ready!")
    let orderNum = req.body.Body.slice(6, 8)
    //update database with finished time
    sendReadySMS(orderNum)
    //pass ready ajaxcall to confirmation page
  }
  else {
    console.log(timeResponse)
    let orderNum = req.body.Body.slice(3, 5)
    sendTimeSMS(timeResponse)
    //pass repondTime to confirmation page and do a ajax call there
  }
  res.end(twiml.toString());
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
