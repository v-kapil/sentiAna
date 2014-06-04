#!/usr/bin/env node
var fs = require('fs'),
    readline = require('readline');
    mongoose = require('mongoose');

////// Initializing mongoose (run local mongod before running this code)
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

////// Reading the file line by line and pushing into mongo 
var fileName = './movieReviews30.txt';
var delim = '--->';
var cnt = 0;
var rd = readline.createInterface({  // read stream is efficient for large files
    input: fs.createReadStream(fileName),
    output: process.stdout,
    terminal: false
});

rd.on('line', function(line) {
    var c = line.split(delim);  // c: columns
    var record = new reviewModel({'index': c[0], 'review': c[2], 'sentiment': '', 'firstName': '', 'lastName': '', 'date': ''});
    record.save(function(err, record){if(err){console.log("Error saving review to mongo");} else{console.log("added record " + cnt++);}});
});
rd.on('close', function(){console.log("finished reading file");});
