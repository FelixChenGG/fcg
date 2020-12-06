const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://Chen:qiya981226@cluster0.k4bwk.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';

const session = require('cookie-session');
const bodyParser = require('body-parser');

const client = new MongoClient(mongourl);


app.set('view engine','ejs');

const SECRETKEY = 'I want to pass COMPS381F';


app.set('view engine','ejs');


app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));

app.set('view engine','ejs');


const findAccount = (db, criteria, callback) => {
    let cursor = db.collection('accounts').find(criteria);
    console.log(`findAccount: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findAccount: ${docs.length}`);
        callback(docs);
    });
}

const verifyAccount = (req, res, criteria) => { 
	const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("verifying...");
		const db = client.db(dbName);

		findAccount(db, criteria, (docs) => {
			client.close();
			var n = 0;

			for (var doc of docs) {
                console.log(doc);
			if(doc.accountId == req.body.id && doc.password == req.body.password){
				console.log("Correct");
			 req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.name;	 // 'username': req.body.name	
				res.redirect('/');
			}
			}
		})

		
	})
}


// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//output
app.get('/', (req,res) => {
	if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
		// Jump to index
		console.log("Jump");
        // jump to secrets page
		res.redirect('/index');
	}
});

//output
app.get('/login', (req,res) => {
     // jump to login page
	res.status(200).render('login',{});
});

//accept the request of /login page
app.post('/login', (req,res) => {
	console.log("start");
	verifyAccount(req,res,req.query);
});

app.get('/signUp', (req,res) => {
	// jump to  page
   res.status(200).render('signUp',{});
});

app.post('/signUp', (req,res) => {
	verifyAccount(req,res,req.query);
	
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);
