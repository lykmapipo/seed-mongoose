'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var UserSchema = new Schema({
  parent: {
    type: ObjectId,
    ref: 'User',
    cascade: true
  },

  username: {
    type: String
  },

  email: {
    type: String
  },

  children: {
    type: [ObjectId],
    ref: 'User'
  },

  kids: [{
    type: ObjectId,
    ref: 'User'
  }]

});

//export model
module.exports = mongoose.model('User', UserSchema);
