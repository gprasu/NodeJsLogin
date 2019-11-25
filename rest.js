//Require Mongoose
var mongoose = require('mongoose');
var express        =        require("express");
var app            =        express();
var uniqueValidator = require('mongoose-unique-validator');
var bodyParser = require('body-parser');
var crypto = require('crypto'),
algorithm = 'aes-256-ctr',
password = 'd6F3Efeq';
app.use(
		bodyParser.urlencoded({
			extended: true
		})
);
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/rest', function (err, res) {
	if (err) {
		console.log ('ERROR connecting to DB:' + err);
	} else {
		console.log ('Succeeded connected to DB');
	}
});

//Define a schema
var Schema = mongoose.Schema;

//Configure bodyparser to handle post requests
var validateEmail=function(email){
	var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
	return emailRegex.test(email);
};

var userSchema = new Schema({
	userName:{type:String,required:true,unique: true},
	firstName:String,
	lastName: String,
	email: {
		type: String,
		trim:true,
		match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']

	},
	password: {type:String,required:true},
	DOB:Date,
	createdDate:{
		type:Date,
	default:Date.now
	}
});

userSchema.plugin(uniqueValidator);

var userModel = mongoose.model('users', userSchema);




function encrypt(text){
	var cipher = crypto.createCipher(algorithm,password);
	var crypted = cipher.update(text,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text){
	var decipher = crypto.createDecipher(algorithm,password);
	var dec = decipher.update(text,'hex','utf8');
	dec += decipher.final('utf8');
	return dec;
}

var server = app.listen(8081, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port);
});

app.get('/verify',function(req,res){
	res.status(200).send("Services are working fine");

});


app.post('/addUser',function(req,res){
	console.log("Request reached to POST method");
	req.body.password = encrypt(req.body.password);
	console.log(req.body.firstName);
	new userModel(req.body).save().then(function(result){
		res.status(201).send({id: result._id});
	}).catch(function(err) {

		res.status(400).send(err);

	});
});


app.post('/login',function(req,res){
	console.log("Verify login Method");
	try{
		var userName=req.body.userName;
		var pw=req.body.password;
		userModel.findOne({'userName': userName},function(err,userModel){
			if(err){
				return res.status(400).send("Invalid username or Password");
			}
			
			console.log(decrypt(userModel.password));

			if(decrypt(userModel.password).toString()===pw){
				res.status(200).send({Status:"Succesful"});
			}
			else{
				res.status(400).send("Invalid username or Password");
			}

		});



	}catch(e){
		console.log(e);
		res.status(404).send("Error :"+e);

	}


});


app.get('/retrieveuser/:email',function(req,res){
	console.log("Request reached to get method");
	try{
		var emailId=req.params.email;
		console.log("user provided email:%s",emailId);
		userModel.find({ 'email': emailId }, function (err, docs) {

			if(!err&&docs){
				res.status(201).send(docs);	
			}
			else if(!docs){
				res.status(204).send("No user details found");
			}


		});

	}catch(e){

		res.send(404).send("Invalid input provided");

	}

});


