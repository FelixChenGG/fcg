const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const formidable = require('express-formidable');
const fs = require('fs');
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

const insertDocument = (db, doc, callback) => {
    db.collection('accounts').
    insertOne(doc, (err, result) => {
        assert.equal(err,null);
        console.log("inserted one document " + JSON.stringify(doc));
        callback();
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
			console.log(req.body.password);
			for (var doc of docs) {
                
			if(doc.id == req.body.id && doc.password == req.body.password){
				console.log("Correct");
			 req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.id;	 	
				
			}
			
			}
			res.redirect('/');
		})

		
	})
}

const signUpAccount = (req, res, criteria) => { 
	const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Sign Up...");
		const db = client.db(dbName);

		findAccount(db, criteria, (docs) => {
		
			var result = false;

			for (var doc of docs) {

			if(doc.accountId == req.body.id && doc.password == req.body.password){
				result = true;
				
			}

			}
			if (result){
				console.log("already exist...");
				res.redirect('/signUp');

			}else{
				console.log("inserting...");
			
				insertDocument(db,req.body,()=>{
					client.close();
					console.log("Create successful...");
					res.redirect('/');
				})
				
			}
		
		})

	})
}

const findRestaurant = (db, criteria, callback) => {
    let cursor = db.collection('restaurants').find(criteria);
    console.log(`findRestaurant: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findRestaurant: ${docs.length}`);
        callback(docs);
    });
}


const listDocument = (req, res,criteria) => { 
	const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("list...data...");
		const db = client.db(dbName);
		const count = 0;
	

		findRestaurant(db, criteria, (docs) => {
			
		//testing...need to modify(table name - account)
				
			res.status(200).render("index",{Restaurant:docs,userName:req.session.username})
			
		})

	})
}

const insertRestaurant = ( doc, callback) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

	db.collection('restaurants').
	insertOne(doc, (err, result) => {
	  assert.equal(err, null);
	  console.log("insert one" + JSON.stringify(doc));
	  callback();
	});
  }) 
}

const createRestaurant =(req, res) => {

	
        console.log("creating...");
		
		var docu = {};
		docu.id = req.fields.id;
		docu.name = req.fields.name;
		docu.borough = req.fields.borough;
		docu.cuisine = req.fields.cuisine;
		
		if (req.files.image.size > 0) {
            fs.readFile(req.files.image.path, (err,data) => {
				assert.equal(err,null);
				docu.photo = {};
					docu.photo.image = new Buffer.from(data).toString('base64');
					docu.photo.minetype = req.files.image.type;
                
            });
        } 
					
		docu.address = {};
		docu.address.street = req.fields.street;
		docu.address.building = req.fields.building;
		docu.address.zipcode = req.fields.zipcode;
		docu.address.coord = req.fields.coord;
		docu.owner = req.fields.owner;
		docu.grades =[];
		console.log(docu);
			insertRestaurant(docu,()=>{
				console.log("insert successful...");
				res.redirect('/index');
			})
	
}

const checkInfor =(req, res,criteria) =>{
	const client = new MongoClient(mongourl);
	client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
		const db = client.db(dbName);

		let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id);

		findRestaurant (db, DOCID, (docs)=>{
			let results= false;
			if( docs[0].grades.length > 0){
				
				for (var doc of docs[0].grades) {
				
				console.log(doc.user);
					if(doc.user == req.session.username){
						results = true;
					}
					console.log(results);}
			
					
			
			}
			res.status(200).render('rate',{doc:req.query,userName:req.session.username,result:results});
		})
		
	})


}
  

const addScore = (criteria, addDoc, callback) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
		const db = client.db(dbName);

		db.collection('restaurants').updateOne(criteria,
			{
				$push: addDoc
				
			},
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );

	})

}

const addGrade = (req, res,criteria) =>{

 console.log("rate score...");
		
		var docu = {};
		docu.grades = {};
		docu.grades.user = req.fields.user;
		docu.grades.score = req.fields.score;
		console.log(docu);
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria._id);
		
		addScore(DOCID,docu,(results)=>{
			console.log("insert successful...");
			console.log(results.result.nModified);
			res.redirect('/index');
		})


}

const deleteRestaurant = ( doc, callback) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

		
	db.collection('restaurants').deleteOne(doc, (err, result) => {
	  assert.equal(err, null);
	  console.log("delete one" + JSON.stringify(doc));
	  callback();
	});
  }) 
}

const deleteDoc=(req, res,criteria) =>{

	let DOCID = {};
	DOCID['_id'] = ObjectID(criteria._id);

deleteRestaurant(DOCID,()=>{
	console.log("delete successful...");
	
	res.redirect('/index');
})

}

const handle_Edit = (req, res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id);

        /* use Document ID for query */
       findRestaurant(db, DOCID, (docs)=>{ 
            res.status(200).render('edit',{restaurants: docs, userName:req.session.username})

    });
});
}

const updateDocument = (criteria, updateDoc, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

         db.collection('restaurants').updateOne(criteria,
            {
                $set : updateDoc
            },
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const handle_Update =(req, res, criteria) => {

	let DOCID = {};
	DOCID['_id'] = ObjectID(criteria._id);

	console.log("updating...");
	console.log(req.fields.id);
	var updateDoc = {};
	updateDoc.id = req.fields.id;
	updateDoc.name = req.fields.name;
	updateDoc.Borough = req.fields.borough;
	updateDoc.Cuisine = req.fields.cuisine;

	if (req.files.image.size > 0) {
		fs.readFile(req.files.image.path, (err,data) => {
			assert.equal(err,null);
			updateDoc.photo = {};
				updateDoc.photo.image = new Buffer.from(data).toString('base64');
				updateDoc.photo.minetype = req.files.image.type;

		});
	}

	updateDoc.address = {};
	updateDoc.address.street = req.fields.street;
	updateDoc.address.building = req.fields.building;
	updateDoc.address.zipcode = req.fields.zipcode;
	updateDoc.address.coord = req.fields.coord;
	updateDoc.owner = req.fields.owner;
	console.log(updateDoc);
	updateDocument(DOCID   ,updateDoc, (results)=>{
			console.log("update successful...");
			res.redirect('/index');
		})

}

const dispDetail =(req, res,criteria) =>{
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
		var collection = db.collection('restaurants');
		
		let DOCID = {};
		DOCID['_id'] = ObjectID(criteria._id);
		
            findRestaurant (db, DOCID, (docs)=>{
				console.log(docs);
				res.status(200).render('details',{datadoc:docs[0]})
				

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
	signUpAccount(req,res,req.query);
	
});
app.get('/index',(req,res) =>{
	listDocument(req,res,req.query);
});

app.post('/search',(req,res)=>{
	var doc = {};
	let temp = '/index';
	console.log(req.body.search);
	switch (req.body.type) {
		case 'name':
		  temp = temp + '?name='+req.body.search;
		  break;
		case 'cuisine':
			temp = temp + '?cuisine='+req.body.search;
			break;
		case 'borough':
			temp = temp + '?borough='+req.body.search;
		  break;
		default:
		  console.log(`Sorry, Error`);
	  }
	 res.redirect(temp);

});



app.get('/create',(req,res) =>{
	res.status(200).render('create',{userName:req.session.username});
})

app.get('/delete',(req,res) =>{
	deleteDoc(req,res,req.query);
});

app.get('/details', (req,res) => {
    dispDetail(req,res,req.query);
});

app.get('/edit',(req,res) =>{
	handle_Edit(req,res,req.query);
});

app.use(formidable());
app.set('view engine', 'ejs');

app.post('/create',(req,res) =>{
	createRestaurant(req,res);
})

app.post('/update',(req,res) =>{
    handle_Update(req, res, req.query);
})

app.get('/rate',(req,res) =>{
	checkInfor(req,res,req.query);
});

app.post('/rate',(req,res) =>{
addGrade(req,res,req.query);
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.get('/api/restaurants/names/:name', (req,res) => {
    if (req.params.name) {
        let criteria = {};
        criteria['name'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findRestaurant(db, criteria, (docs) => {
                client.close();
				console.log("Closed DB connection");
				
					res.status(200).json(docs);
				
                
            });
        });
    } else {
        res.status(500).json({"error": "missing name"});
    }
})

app.get('/api/restaurants/borough/:borough', (req,res) => {
    if (req.params.borough) {
        let criteria = {};
        criteria['borough'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findRestaurant(db, criteria, (docs) => {
                client.close();
				console.log("Closed DB connection");
				
					res.status(200).json(docs);
				
                
            });
        });
    } else {
        res.status(500).json({"error": "missing borough"});
    }
})

app.get('/api/restaurants/cuisine/:cuisine', (req,res) => {
    if (req.params.cuisine) {
        let criteria = {};
        criteria['cuisine'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findRestaurant(db, criteria, (docs) => {
                client.close();
				console.log("Closed DB connection");
				
					res.status(200).json(docs);
				
                
            });
        });
    } else {
        res.status(500).json({"error": "missing cuisine"});
    }
})



app.listen(process.env.PORT || 8098);
