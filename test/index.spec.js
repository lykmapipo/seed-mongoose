'use strict';

//dependencies
const path = require('path');
const expect = require('chai').expect;
const seed = require(path.join(__dirname, '..'));
require(path.join(__dirname, '..', 'models', 'User'));

describe('seed mongoose', function () {

  it('should be a functional module', function () {
    expect(seed).to.exist;
    expect(seed).to.be.a('function');
  });

  it('should be able to seed test data', function (done) {
    seed({ environment: 'test' }, function (error, seeds) {
      expect(error).to.not.exist;
      expect(seeds).to.exist;
      expect(seeds).to.have.length.above(0);
      done(error, seeds);
    });
  });

  it('should be able to seed development data', function (done) {
    seed({ environment: 'development' }, function (error, seeds) {
      expect(error).to.not.exist;
      expect(seeds).to.exist;
      expect(seeds).to.have.length.above(0);
      done(error, seeds);
    });
  });

  it('should be able to seed producton data', function (done) {
    seed({ environment: 'production' }, function (error, seeds) {
      expect(error).to.not.exist;
      expect(seeds).to.exist;
      expect(seeds).to.have.length.above(0);
      done(error, seeds);
    });
  });

});
