var express = require('express');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://mohan2107%40gmail.com:pops123*@smtp.gmail.com');

var router = express.Router();

/* GET /loaction/id */
router.get('/', function(req, res, next) {
 
    res.json({"test": "ok"});
  
});

module.exports = router;