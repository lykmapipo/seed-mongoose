'use strict';

//set environment to test
process.env.NODE_ENV = 'test';

//dependencies
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//allow mongoose query debuging
// mongoose.set('debug', true);


before(function (done) {
  mongoose.connect('mongodb://localhost/seed-mongoose', done);
});


after(function (done) {
  mongoose.connection.dropDatabase(done);
});
