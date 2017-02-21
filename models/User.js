'use strict';

//dependencies
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  parent: {
    type: ObjectId,
    ref: 'User',
    index: true
  },

  guardian: {
    type: ObjectId,
    ref: 'User'
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
