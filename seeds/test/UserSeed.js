'use strict';

const faker = require('faker');

//function to be evaluated to obtain data
//it may also be an object or array
module.exports = function (done) {

  const data = [{
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

  }, { //test prevent seed object of same hash multiple times
    username: 'gi chan',
    email: 'gichan@seedmongoose.dt',
  }, {
    username: 'gi chan',
    email: 'gichan@seedmongoose.dt',
  }];

  done(null, data);
};
