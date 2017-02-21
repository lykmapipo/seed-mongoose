'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const async = require('async');
const hashObject = require('object-hash');
const expect = require('chai').expect;
const faker = require('faker');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const seed = require(path.join(__dirname, '..', 'lib', 'seed'));
let Simple;
let SimpleRef;
let OtherRef;

describe('seed', function () {

  before(function () {
    const SimpleSchema = new Schema({
      first: { type: String, unique: true }
    });
    Simple = mongoose.model('Simple', SimpleSchema);
  });

  before(function () {
    const SimpleRefSchema = new Schema({
      start: { type: ObjectId, ref: 'SimpleRef' },
      last: { type: ObjectId, ref: 'SimpleRef' },
      first: { type: String },
      kids: [{ type: ObjectId, ref: 'SimpleRef' }]
    });
    SimpleRef = mongoose.model('SimpleRef', SimpleRefSchema);
  });

  before(function () {
    const OtherRefSchema = new Schema({
      start: { type: ObjectId, ref: 'Simple' },
      last: { type: ObjectId, ref: 'Simple' },
      first: { type: String },
      kids: [{ type: ObjectId, ref: 'Simple' }]
    });
    OtherRef = mongoose.model('OtherRef', OtherRefSchema);
  });

  it('should be an object', function () {
    expect(seed).to.be.an('object');
    expect(seed).to.include.keys('seeded', 'single');
    expect(seed.seeded).to.be.a('object');
    expect(seed.single).to.be.a('function');
  });


  it('should be able to seed single simple model', function (done) {
    const data = { first: faker.name.findName() };
    const hash = hashObject(data);
    seed.single({
      modelName: 'Simple',
      data: data,
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[hash]).to.exist;

      done(error, seeded);

    });

  });

  it('should not be able to seed single simple model twice', function (done) {
    const data = { first: faker.name.findName() };
    const hash = hashObject(data);

    async.series({

      first: function (next) {
        seed.single({
          modelName: 'Simple',
          data: data,
          graph: {}
        }, next);
      },

      repeat: function (next) {
        seed.single({
          modelName: 'Simple',
          data: data,
          graph: {}
        }, next);
      }

    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[hash]).to.exist;

      expect(seeded.first._id)
        .to.eql(seeded.repeat._id);

      done(error, seeded);

    });

  });

  it('should be able to seed multiple simple model', function (done) {
    const data = { first: faker.name.findName() };
    const hash = hashObject(data);
    seed.many({
      modelName: 'Simple',
      data: [data],
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[hash]).to.exist;

      done(error, seeded);

    });

  });

  it('should not be able to seed multiple same simple model twice',
    function (done) {
      const data = { first: faker.name.findName() };
      const hash = hashObject(data);
      seed.many({
        modelName: 'Simple',
        data: [data, data],
        graph: {}
      }, function (error, seeded) {

        expect(error).to.not.exist;
        expect(seeded).to.exist;

        expect(seed.seeded[hash]).to.exist;

        expect(_.first(seeded)._id)
          .to.eql(_.last(seeded)._id);

        done(error, seeded);

      });

    });

  it('should be able to seed self ref model', function (done) {
    const start = { first: faker.name.findName() };
    const data = { start: start, first: faker.name.findName() };
    const startHash = hashObject(start);

    seed.single({
      modelName: 'SimpleRef',
      data: data,
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[startHash]).to.exist;

      expect(seeded.start).to.exist;

      done(error, seeded);

    });

  });

  it('should not be able to seed self ref model twice', function (done) {
    const start = { first: faker.name.findName() };
    const last = start;
    const data = { start: start, last: last, first: faker.name.findName() };
    const startHash = hashObject(start);
    const lastHash = hashObject(last);

    seed.single({
      modelName: 'SimpleRef',
      data: data,
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[startHash]).to.exist;
      expect(seed.seeded[lastHash]).to.exist;

      expect(seeded.start).to.be.eql(seeded.last);

      done(error, seeded);

    });

  });

  it('should be able to seed collection of self child ref model',
    function (done) {
      const kids = [
        { first: faker.name.findName() },
        { first: faker.name.findName() }
      ];
      const data = { first: faker.name.findName(), kids: kids };

      seed.single({
        modelName: 'SimpleRef',
        data: data,
        graph: {}
      }, function (error, seeded) {

        expect(error).to.not.exist;
        expect(seeded).to.exist;

        expect(seeded.kids).to.exist;
        expect(seeded.kids).to.have.length(2);

        done(error, seeded);

      });

    });

  it('should not be able to seed collection of self child ref model twice',
    function (done) {
      const first = { first: faker.name.findName() };
      const last = first;
      const kids = [
        first,
        last
      ];
      const data = { first: faker.name.findName(), kids: kids };

      seed.single({
        modelName: 'SimpleRef',
        data: data,
        graph: {}
      }, function (error, seeded) {

        expect(error).to.not.exist;
        expect(seeded).to.exist;

        expect(seeded.kids).to.exist;
        expect(seeded.kids).to.have.length(1);

        done(error, seeded);

      });

    });

  it('should be able to seed other ref model', function (done) {
    const start = { first: faker.name.findName() };
    const data = { start: start, first: faker.name.findName() };
    const startHash = hashObject(start);

    seed.single({
      modelName: 'OtherRef',
      data: data,
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[startHash]).to.exist;

      expect(seeded.start).to.exist;

      done(error, seeded);

    });

  });

  it('should not be able to seed other ref model twice', function (done) {
    const start = { first: faker.name.findName() };
    const last = start;
    const data = { start: start, last: last, first: faker.name.findName() };
    const startHash = hashObject(start);

    seed.single({
      modelName: 'OtherRef',
      data: data,
      graph: {}
    }, function (error, seeded) {

      expect(error).to.not.exist;
      expect(seeded).to.exist;

      expect(seed.seeded[startHash]).to.exist;

      expect(seeded.start).to.exist;
      expect(seeded.last).to.exist;
      expect(seeded.start).to.be.eql(seeded.last);

      done(error, seeded);

    });

  });

  it('should be able to seed collection of other ref model',
    function (done) {
      const kids = [
        { first: faker.name.findName() },
        { first: faker.name.findName() }
      ];
      const data = { first: faker.name.findName(), kids: kids };

      seed.single({
        modelName: 'OtherRef',
        data: data,
        graph: {}
      }, function (error, seeded) {

        expect(error).to.not.exist;
        expect(seeded).to.exist;

        expect(seeded.kids).to.exist;
        expect(seeded.kids).to.have.length(2);

        done(error, seeded);

      });

    });

  it('should not be able to seed collection of other ref model twice',
    function (done) {
      const first = { first: faker.name.findName() };
      const kids = [
        first,
        first
      ];
      const data = { first: faker.name.findName(), kids: kids };

      seed.single({
        modelName: 'OtherRef',
        data: data,
        graph: {}
      }, function (error, seeded) {

        expect(error).to.not.exist;
        expect(seeded).to.exist;

        expect(seeded.kids).to.exist;
        expect(seeded.kids).to.have.length(1);

        done(error, seeded);

      });

    });

  afterEach(function (done) {
    Simple.remove(done);
  });

  afterEach(function (done) {
    SimpleRef.remove(done);
  });

  afterEach(function (done) {
    OtherRef.remove(done);
  });

});
