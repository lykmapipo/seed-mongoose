'use strict';

//dependencies
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var seed = require(path.join(__dirname, '..'));
var faker = require('faker');
var User = require(path.join(__dirname, '..', 'models', 'User'));

//trace seeding intergration with mongoose
var $$seed;

describe('seed', function() {

    //setup test environment
    before(function() {
        $$seed = seed();
        mongoose.connect('mongodb://localhost/seed-mongoose');
    });


    it('should be a functional module', function(done) {
        expect(seed).to.be.a('function');
        done();
    });

    it('should have default configuration value', function(done) {
        var $seed = seed();

        expect($seed.options).to.exist;
        expect($seed.options.active).to.be.true;
        expect($seed.options.cwd).to.be.equal(process.cwd());
        expect($seed.options.path).to.be.equal('seeds');
        expect($seed.options.environment).to.be.equal('test');

        done();
    });

    it('should load persistent storage with the provided seeds', function(done) {
        setTimeout(function() {
            User
                .count(function(error, count) {
                    if (error) {
                        done(error);
                    } else {
                        expect(count).to.be.above(0);
                        done();
                    }
                });
        }, 1000);
    });

    it('should be able to extend options', function(done) {
        var $seed = seed({
            cwd: 'data',
            path: 'fixtures',
            environment: 'development',
            active: false
        });

        expect($seed.options).to.exist;
        expect($seed.options.active).to.be.false;
        expect($seed.options.cwd).to.be.equal('data');
        expect($seed.options.path).to.be.equal('fixtures');
        expect($seed.options.environment).to.be.equal('development');

        done();
    });


    it('should be able to prepare work(s) to be performed from `array` seeds type', function(done) {
        var $seed = seed();

        var seeds = {
            UserSeed: [{
                username: faker.internet.userName(),
                email: faker.internet.email()
            }, {
                username: faker.internet.userName(),
                email: faker.internet.email()
            }]
        };

        var works = $seed.prepareWork(seeds);

        expect(works).to.be.a('array');
        expect(works.length).to.be.equal(2);

        var work = works[0];

        expect(work).to.be.a('function');

        //note!
        //since a work its just a wrapper for
        //Model.findOneAndUpdate
        //lets be sure its doing
        //what it supposed to do
        work(function(error, user) {

            expect(user.id).to.not.be.null;
            expect(user.username).to.not.be.null;
            expect(user.email).to.not.be.null;

            done(error, user);
        });
    });


    it('should be able to prepare work to be performed from `object` seed type', function(done) {
        var $seed = seed();

        var seeds = {
            UserSeed: {
                username: faker.internet.userName(),
                email: faker.internet.email()
            }
        };

        var works = $seed.prepareWork(seeds);

        expect(works).to.be.a('array');
        expect(works.length).to.be.equal(1);

        var work = works[0];

        expect(work).to.be.a('function');

        //note!
        //since a work its just a wrapper for
        //Model.findOneAndUpdate
        //lets be sure its doing
        //what it supposed to do
        work(function(error, user) {

            expect(user.id).to.not.be.null;
            expect(user.username).to.not.be.null;
            expect(user.email).to.not.be.null;

            done(error, user);
        });
    });

    it('should be able to prepare work(s) to be performed from `function` seeds type', function(done) {
        var $seed = seed();

        var seeds = {
            UserSeed: function(done) {

                var data = [{
                    username: faker.internet.userName(),
                    email: faker.internet.email()
                }, {
                    username: faker.internet.userName(),
                    email: faker.internet.email()
                }];

                done(null, data);
            }
        };

        var works = $seed.prepareWork(seeds);

        expect(works).to.be.a('array');
        expect(works.length).to.be.equal(2);

        var work = works[0];

        expect(work).to.be.a('function');

        //note!
        //since a work its just a wrapper for
        //Model.findOneAndUpdate
        //lets be sure its doing
        //what it supposed to do
        work(function(error, user) {

            expect(user.id).to.not.be.null;
            expect(user.username).to.not.be.null;
            expect(user.email).to.not.be.null;

            done(error, user);
        });
    });

    it('should be able to load test environment specific seeds', function(done) {
        var $seed = seed({
            cwd: process.cwd(),
            path: 'seeds',
            environment: 'test',
            active: false
        });

        $seed.load(function(error, result) {

            expect(result.environment).to.equal('test');
            expect(result.data).to.not.be.null;

            done(error, result);

        });

    });

    it('should be able to load development environment specific seeds', function(done) {
        var $seed = seed({
            cwd: process.cwd(),
            path: 'seeds',
            environment: 'development',
            active: false
        });

        $seed.load(function(error, result) {

            expect(result.environment).to.equal('development');
            expect(result.data).to.not.be.null;

            done(error, result);

        });
    });

    it('should be able to load production environment specific seeds', function(done) {
        var $seed = seed({
            cwd: process.cwd(),
            path: 'seeds',
            environment: 'production',
            active: false
        });

        $seed.load(function(error, result) {

            expect(result.environment).to.equal('production');
            expect(result.data).to.not.be.null;

            done(error, result);
        });
    });


    it('should be able to load seeds from custom path', function(done) {
        var $seed = seed({
            cwd: process.cwd(),
            path: 'fixtures',
            environment: 'test',
            active: false
        });

        $seed.load(function(error, result) {

            expect(result.environment).to.equal('test');
            expect(result.data).to.not.be.null;

            done(error, result);
        });
    });

    it('should be able to load seeds with custom suffix', function(done) {
        var $seed = seed({
            cwd: process.cwd(),
            path: 'seeds',
            suffix: '_seed',
            environment: 'development',
            active: false
        });

        $seed.load(function(error, result) {

            expect(result.environment).to.equal('development');
            expect(result.data).to.not.be.null;

            done(error, result);

        });

    });

});