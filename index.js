'use strict';

//dependencies
var path = require('path');
var _ = require('lodash');
var async = require('async');
var inflection = require('inflection');
var mongoose = require('mongoose');

/**
 * @function
 * @description DRY data seeding for mongoose.
 * 
 * @param  {Object} options seed configurations
 */
function Seed(options) {
    //defaults configurations
    this.options = {
        //set seeding to be active by default
        active: true,

        //current working directory
        cwd: process.cwd(),

        //directory where seeds resides
        //relative to `process.cwd()`
        path: 'seeds',

        //logger to log seeding progress
        logger: console,

        //detect seeding environment
        //default to development environment
        environment: _.get(process.env, 'NODE_ENV', 'development')

    };

    //extend default options
    this.options = _.merge(this.options, options);

    //normalize logger
    this.options.logger.debug = this.options.logger.debug ||
        (this.options.logger.log || this.options.logger.info);

    this.options.logger.error = this.options.logger.error ||
        (this.options.logger.log || this.options.logger.info);

    //reference mongoose connection
    var connection = mongoose.connection;

    //on mongoose connecting
    //load seeds if seeding is enabled
    if (this.options.active) {
        connection.on('connecting', function() {
            this.load(function(error, result) {
                if (error) {
                    //notify seeding error
                    connection.emit('seeding error', error);
                } else {
                    //notify seeding succeed
                    connection.emit('seeding succeed', result);
                }
            });
        }.bind(this));
    }
}



/**
 * @description Take seed data and check if it is of array or object type
 *              and prepare work to be performed from it
 * @param  {Array} work     A collection of database queries to be
 *                          performed to seed data into database
 * @param  {Object} model   A valid mongoose model
 * @param  {Object|Array|Function} seedData An array or object contains 
 *                                          data or a function to be evaluated
 *                                          to obtain data to seeded into database
 *
 * @private
 */
Seed.prototype.prepare = function(work, model, seedData) {
    //reference configurations
    var logger = this.options.logger;

    //is data just a plain object
    if (_.isPlainObject(seedData)) {
        //push work to be done
        work.push(function(next) {
            //create seed function
            model.findOneAndUpdate(seedData, seedData, {
                new: true,
                upsert: true
            }, next);
        });
    }

    //is array data
    if (_.isArray(seedData)) {
        _.forEach(seedData, function(data) {
            //push work to be done
            work.push(function(next) {
                //create seed function
                model.findOneAndUpdate(data, data, {
                    new: true,
                    upsert: true
                }, next);
            });
        });
    }

    //is functional data
    if (_.isFunction(seedData)) {
        //evaluate function to obtain data
        seedData(function(error, data) {
            //current log error and continue
            //
            //TODO should we throw?
            if (error) {
                logger.error(error);
            }

            //invoke prepare with data
            else {
                //this refer to seed instance context
                this.prepare(work, model, data);
            }
        }.bind(this));
    }
};


/**
 * @function
 * @description prepare work to be performed during seeding the data
 * @param {Object} config seeding configurations
 * @param  {Object} seeds environment specific loaded seeds from the seeds directory
 * @return {Array} a collection of works to be performed during data loading
 * @private
 */
Seed.prototype.prepareWork = function(seeds) {
    //work to be done
    //in parallel during
    //data seeding
    var work = [];

    //prepare all seeds
    //data for parallel execution
    _.keys(seeds)
        .forEach(function(seed) {
            // deduce model name
            var modelName = seed.replace(/Seed$/, '');

            //pluralize model global id if enable
            modelName = inflection.classify(modelName);

            //grab mongoose model from its name
            var Model = mongoose.model(modelName);

            //grab data to load
            //from the seed data attribute
            var seedData = seeds[seed];

            //prepare work from seed data
            this.prepare(work, Model, seedData);

        }.bind(this));

    return work;
};


/**
 * @function
 * @description loading seed's data into configured model persistent storage
 * @param {Function} done  a callback to invoke on after seeding
 * @private
 */
Seed.prototype.load = function(done) {
    //reference logger
    var config = this.options;
    var logger = config.logger;

    //deduce seeds path to use
    //based on current environment
    var seedsPath =
        path.join(config.cwd, config.path, config.environment);

    //log seed environment
    logger.debug('start seeding %s data', config.environment);

    //log seed location
    logger.debug('seeding from %s', seedsPath);

    //load all seeds available
    //in   `seedsPath`
    var seeds = require('require-all')({
        dirname: seedsPath,
        filter: /(.+Seed)\.js$/,
        excludeDirs: /^\.(git|svn)$/
    });

    //prepare seeding work to perfom
    var work = this.prepareWork(seeds);

    //if there is a work to perform
    if (_.size(work) > 0) {
        //now lets do the work
        //in parallel fashion
        async.parallel(work, function(error, results) {
            //signal seeding complete
            logger.debug('complete seeding %s data', config.environment);

            done(error, {
                environment: config.environment,
                data: results
            });
        });
    }
    //nothing to perform back-off
    else {
        done();
    }
};


//exports
module.exports = function(options) {
    //ensure singleton
    if (!Seed.singleton) {
        Seed.singleton = new Seed(options);
    }

    //extend options otherwise
    if (options && _.isPlainObject(options)) {
        Seed.singleton.options = _.merge(Seed.singleton.options, options);
    }

    return Seed.singleton;
};