// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongooseaudit = require('mongoose-audit');
var json2csv = require('json2csv');
var fs = require('fs');





var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://mohan2107%40gmail.com:pops123*@smtp.gmail.com');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Employee   = require('./app/models/employee'); // get our mongoose model
var Session   = require('./app/models/session'); // get our mongoose model

// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 4000; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var sess;

//session config 

app.use(session({secret: 'eee-ttt-yyy-uuu'}));


// use morgan to log requests to the console
app.use(morgan('dev'));

// =================================================================
// routes ==========================================================
// =================================================================



app.get('/setup', function(req, res) {

	// create a sample user
	var nick = new User({ 
		name: 'Nick Cerminara', 
		password: 'password',
		admin: true 
	});
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});

// basic route (http://localhost:8080)
app.get('/', function(req, res) {
	res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router(); 

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
apiRoutes.post('/authenticate', function(req, res) {

	// find the user
	User.findOne({
		name: req.body.name
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create a token
				var token = jwt.sign(user, app.get('superSecret'), {
					expiresIn: 86400 // expires in 24 hours
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		

		}

	});
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

apiRoutes.get('/check', function(req, res) {
	res.json(req.decoded);
});

// =================================================================
// Employee actions ================================================
// =================================================================

apiRoutes.post('/users/createemployee', function(req, res) {
	 Employee.findOne({"email":req.body.email}, function (err, post) {
		 console.log(post);
		 if(post == '' || post == null ){
			  Employee.create(req.body, function (err, post) {
				if (err){
					console.log("err",err);
					res.json({
					"message": "Registration failed",
					"employee" :post,
					"error" : err
					});
				}else{
					// setup e-mail data with unicode symbols 
					var mailOptions = {
						from: '"Emp " <mohan2107@gmail.com>', // sender address 
						to: req.body.email, // list of receivers 
						subject: 'Hello '+req.body.name, // Subject line 
						text: 'Hello '+req.body.email, // plaintext body 
						html: '<b>Emp account has been created successfully</b>' // html body 
					};
					var mailStatus = sendEmail(mailOptions);
					console.log("mail",mailStatus);
					res.json(
					{
						"message":"Registration success",
						"mail":mailStatus,
						"Employee" :post,
						"status": 1
					}
					);
				}
			  });
		 }else{
        res.json({
                  "message": "Email Already Exist",
                  "employee" :post,
                  "status": 0
                 
                  });
      }
	 });
		 
});

apiRoutes.post('/users/loginemployee', function(req, res) {
	sess = req.session;
	 var qr = {$and:[{email:req.body.email,password:req.body.password}]};
    
     Employee.find(qr, function (err, post) {
       console.log("post--",post);
        if(post == '' || post == null ){
           res.json(
             {
              "message": "Login failed",
              "employee" :post,
              "error" : err,
              "status" : 0
              });
        }else{
			Session.find({"email": req.body.email},function(err, post){
				if(err){
					console.log(err);
				}else{
					if(post == '' || post == null ){
						Session.create({"email": req.body.email},function(){
							console.log("added to db");
						});
					}
				}
			});
          res.json(
            {
              "message":"login success",
              "employee" :post,
              "status" : 1
            }
            );
			sess.email = req.body.email;
			res.end('done');
        }
     });
});

apiRoutes.get('/users/employeeall', function(req, res) {
	Employee.find({},function(err, post){
		if(err){
			console.log(err);
		}else{
			json2csv({data: post, fields: ['name', 'email', 'password']}, function(err, csv) {
			if (err) console.log(err);
			fs.writeFile('downloads/employee.csv', csv, function(err) {
				if (err) throw err;
				console.log('file saved');
			});
			});
			res.json(
            {
              "message":"List Of employee",
              "employees" :post,
              "status" : 1
            }
            );
		}
	});
	
});

apiRoutes.get('/users/employeecsv', function(req, res) {
	Employee.find({},function(err, post){
		if(err){
			console.log(err);
		}else{
			json2csv({data: post, fields: ['name', 'email', 'password','status']}, function(err, csv) {
			if (err) console.log(err);
			fs.writeFile('downloads/employee.csv', csv, function(err) {
				if (err) throw err;
				console.log('file saved');
			});
			});
			res.json(
            {
              "message":"employee details saved in csv file",
			  "file Path": "/downloads/employee.csv"
             
            }
            );
		}
	});
	
});

apiRoutes.get('/users/employeepdf', function(req, res) {
	Employee.find({},function(err, post){
		if(err){
			console.log(err);
		}else{

			
			res.json(
            {
              "message":"employee details saved in csv file",
			  "file Path": "/downloads/employee.csv"
             
            }
            );
		}
	});
	
});

apiRoutes.get('/users/employee', function(req, res) {
	console.log(sess.email);
	res.json({"email": sess.email});
});


apiRoutes.get('/users/logout',function(req,res){
	console.log(sess.email);
	var email = sess.email;
	Session.remove({"email": email},function (err, post,next) {
	
		//res.json(post);
		console.log("removed from db");
	});
req.session.destroy(function(err) {
  if(err) {
    console.log(err);
  } else {
	
    res.redirect('/');
  }
});



});


function sendEmail(mailOptions)
{
   

 // verify connection configuration 
transporter.verify(function(error, success) {
  var mailInfo ="";
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
        // send mail with defined transport object 
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                mailInfo = '{"message": error}';
            }else
            {
              mailInfo = '{"message":"mail sent successfully","info" : '+info.response+'}';
            }
           
            console.log('Message sent: ' + info.response);
        });
         return mailInfo;
   }
});

}
app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
