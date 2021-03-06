var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dburl = 'mongodb://localhost:27017/local';
var col;

var https = require('https');

// connect db
MongoClient.connect(dburl, function(err, db) {
	if(err) {
		console.log('Connecting to DB failed');
	} else {
		col = db.collection('tweets');
		if(!col) {
			console.log('Connecting to Collection failed');
		}
	}
});

router.post('/', function(req, res, next) {
	if(req.get('x-amz-sns-message-type') == 'Notification') {
		var tweet_id = JSON.parse(JSON.parse(req.body).Message)._id;
		// extract sentiment info from DB
		if(col) {
			col.findOne({_id: new ObjectID(tweet_id)}, function(err, doc) {
				if(err || !doc) {
					console.log('Fetching documents failed');
				} else {
					var data = {}
					data._id = doc._id.toHexString();
					// console.log(doc);
					data.sentiment = doc.sentiment;
					// send sentiment to clients
					var io = global.socketio;
					// io.emit('sentiment', data);
					io.emit('data', doc);
				}
			});
		}
	} else if(req.get('x-amz-sns-message-type') == 'SubscriptionConfirmation') {
		var subscribeURL = JSON.parse(req.body).SubscribeURL;
		https.get(subscribeURL, function(res) {
			console.log('Subscription Confirmed!');
			res.on('data', function(chunk) {
				console.log('' + chunk);
			});
		}).on('error', function(e) {
			console.log(e);
		});
	} else {
		console.log('Illegal Notification Received');
	}
	res.send('received');
});

module.exports = router;
