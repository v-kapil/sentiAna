#!/usr/bin/env node
var fs = require('fs'),
    readline = require('readline'),
    querystring = require('querystring'),
    mongoose = require('mongoose');

////// Initializing mongoose (run mongod and run script to add records to db before running this)
var mongoHost = 'localhost';
var mongoPort = 27017;
var databaseName = 'imdbReviews'
var uri = 'mongodb://' + mongoHost + ':' +  String(mongoPort) + '/' + databaseName;
var options = {user: '', pass: ''};

var reviewSchema = mongoose.Schema({
    index : Number,
    review : String,
    sentiment : String,
    firstName : String,
    lastName : String,
    date : Date
});
var reviewModel = mongoose.model('reviewCollection', reviewSchema);
mongoose.connect(uri, options);
mongoose.connection.on('error', console.error.bind(console, 'mongo connection error:'));
mongoose.connection.on('connected', function(){console.log('mongoose connected to '+ uri)});
mongoose.connection.on('disconnected', function(){console.log('mongoose disconnected')});
process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through termination');
        process.exit(0);
    });
});

////// setting up things for http POST query (can not send long reviews as query string with GET) 
var http = require('http');
var wrData = querystring.stringify({id: 'pravici', text: 'place holder'}); // text would take review text
var cnt = 0;
var options = {
    host: 'flask-collectivesense.rhcloud.com',
    port: 80,                    
    path: '/',   
    method: 'POST',                
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 0 // updated later
    }
};

////// Taking documents from database and doing sentiment query on them and saving the result back 
var stream = reviewModel.find().stream(); // instead of making single array of all records, return stream
stream.on('data', function (doc) {
    var wrData = querystring.stringify({id: 'pravici', text: doc['review']});
    options['headers']['Content-Length'] = wrData.length;
    var request = http.request(options, function(response) {
        //console.log('STATUS: ' + response.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(response.headers));
        response.setEncoding('utf8');
        response.on('data', function(chunk){
            var j = JSON.parse(chunk);
            var polarity = Number(j.polarity);
            var sentiment = "nut";
            if(polarity < 0) {sentiment = "neg"};
            if(polarity > 0) sentiment = "pos";
            //console.log(chunk);
            doc['sentiment'] = sentiment;
            doc.save(function(err, record){if(err){console.log("Error saving review to mongo")}else{console.log('updated doc saved '+ cnt++);}});
        });
    });
    request.on('error', function(e){console.log('Problems with request ' + e.message);});
    request.write(wrData);
    request.end();

}).on('error', function (err) {
    console.log("error while reading database");
}).on('close', function () {
    console.log("finished iterating over database");
});
