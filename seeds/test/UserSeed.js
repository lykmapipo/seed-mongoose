'use strict';

var faker = require('faker');

//function to be evaluated to obtain data
//it may also be an object or array
module.exports = function (done) {

  var data = [{
    parent: {
      username: 'Good Joe',
      email: 'goodjoe@seedmongoose.dt'
    },

    guardian: { //to test parent & gurdian only seed once
      username: 'Good Joe',
      email: 'goodjoe@seedmongoose.dt'
    },

    username: faker.internet.userName(),
    email: faker.internet.email(),

    children: [{
      username: faker.internet.userName(),
      email: faker.internet.email()
    }, {
      username: faker.internet.userName(),
      email: faker.internet.email()
    }],

    kids: [{
      username: faker.internet.userName(),
      email: faker.internet.email()
    }, {
      username: faker.internet.userName(),
      email: faker.internet.email()
    }]

  }, {
    username: faker.internet.userName(),
    email: faker.internet.email(),
  }];

  done(null, data);
};
