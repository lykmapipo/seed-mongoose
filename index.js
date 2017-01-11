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

    //suffix to use match seeds when loading
    //seeds from a seed directory
    suffix: 'Seed',

    //logger to log seeding progress
    logger: console,

    //detect seeding environment
    //default to development environment
    environment: _.get(process.env, 'NODE_ENV', 'development')

  };

  //extend default options
  this.options = _.merge({}, this.options, options);

  //normalize logger
  this.options.logger.debug = this.options.logger.debug ||
    (this.options.logger.log || this.options.logger.info);

  this.options.logger.error = this.options.logger.error ||
    (this.options.logger.log || this.options.logger.info);

  //reference mongoose connection
  var connection = mongoose.connection;

  //on mongoose connecting
  //load seeds if seeding is enabled
  if (connection && this.options.active) {
    connection.on('connecting', function () {
      this.load(function (error, result) {
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
 * @description prepare relation to be pre save and post saved for a given
 *              model
 * @param  {Model} model valid mongoose model under seed
 * @return {Object}        preSave-d and postSave-d metadata
 * @private
 */
Seed.prototype.cascade = function (model) {

  //prepare cascades options
  var cascades = {
    preSave: [],
    postSave: []
  };

  model.schema.eachPath(function (path, schemaType) {

    //handle single ref for pre save
    var isObjectId = schemaType && schemaType.instance &&
      schemaType.instance === 'ObjectID';

    var hasRef = schemaType.instance && schemaType.options &&
      schemaType.options.ref;

    if (isObjectId && hasRef) {
      cascades.preSave.push({
        ref: schemaType.options.ref,
        path: path
      });
    }


    //handle array of ref for post save
    var isObjectIdArray = schemaType && schemaType.instance &&
      schemaType.instance === 'Array' && schemaType.caster &&
      schemaType.caster.instance === 'ObjectID';

    hasRef = schemaType.instance && schemaType.options &&
      (schemaType.options.ref || _.get(schemaType, 'caster.options.ref'));

    if (isObjectIdArray && hasRef) {
      cascades.postSave.push({
        ref: schemaType.options.ref || _.get(schemaType,
          'caster.options.ref'),
        path: path
      });
    }

  });

  return cascades;

};


/**
 * @description seed a particular model with provided data. In case of related 
 *              model try to pre save and post save them.
 * @param  {Model}   model current model under seed
 * @param  {Object}   data  model data to be seed-ed
 * @param  {Function} done  a callback to invoke on success or failure
 * @return {Object}
 * @private
 */
Seed.prototype.seed = function (model, data, done) {

  //obtain cascades options
  var cascades = this.cascade(model);

  //prepare pre saved relations
  var preSaves = {};

  cascades.preSave.map(function (preSave) {

    //obtain related model
    var Relation = mongoose.model(preSave.ref);

    //obtain value from updates
    var value = _.get(data, preSave.path);

    //check if its allowed value to be persisted
    var isAllowedValue = value && _.isPlainObject(value);

    //push into stack relations to be created
    //before saving
    if (Relation && isAllowedValue) {

      preSaves[preSave.path] = function (next) {

        //upsert relations
        Relation.findOneAndUpdate(value, value, {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }, next);

      };

    }

  });

  //prepare post saves
  var postSaves = {};

  cascades.postSave.map(function (postSave) {

    //obtain related model
    var Relation = mongoose.model(postSave.ref);

    //obtain value from updates
    var values = _.get(data, postSave.path);
    values = _.compact([].concat(values));

    //remove path data to fix cast errors
    data = _.omit(data, postSave.path);

    //check if its allowed value to be persisted
    var isAllowedValue = values && _.isArray(values);

    //push into stack relations to be created
    //before saving
    if (Relation && isAllowedValue) {

      var works = [];

      values.forEach(function (value) {

        works.push(function (next) {

          //upsert relations
          Relation.findOneAndUpdate(value, value, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
          }, next);

        });

      });

      postSaves[postSave.path] = function (next) {
        async.parallel(_.compact(works), next);
      };

    }

  });

  async.waterfall([

    function preSave(next) {
      if (_.keys(preSaves).length > 0) {
        async.parallel(preSaves, next);
      } else {
        next(null, {});
      }
    },

    function save(results, next) {
      //ensure conditions and updates
      results = _.mapValues(results, '_id');
      data = _.merge({}, data, results);
      data = _.merge({}, data, results);

      model.findOneAndUpdate(data, data, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }, next);

    },

    function postSave(saved, next) {
      if (_.keys(postSaves).length > 0) {
        async.parallel(postSaves, function (error, results) {
          _.forEach(results, function (value, key) {
            saved[key] = _.map(value, '_id');
          });
          next(error, saved);
        });
      } else {
        next(null, saved);
      }
    }
  ], done);

};


/**
 * @description Take seed data and check if it is of array or object type
 *              and prepare work to be performed from it
 * @param  {Array} work     A collection of database queries to be
 *                          performed to seed data into database
 * @param  {Object} model   A valid mongoose model
 * @param  {Object|Array|Function} seedData An array or object contains 
 *                                          data or a function to be evaluated
 *                                          to obtain data to seeded into 
 *                                          database
 *
 * @private
 */
Seed.prototype.prepare = function (work, model, seedData) {
  //reference configurations
  var logger = this.options.logger;

  //is data just a plain object
  if (_.isPlainObject(seedData)) {

    //push work to be done
    work.push(function (next) {

      //create seed function
      this.seed(model, seedData, next);

    }.bind(this));

  }

  //is array data
  if (_.isArray(seedData)) {

    _.forEach(seedData, function (data) {

      //push work to be done
      work.push(function (next) {

        //create seed function
        this.seed(model, data, next);

      }.bind(this));

    }.bind(this));

  }

  //is functional data
  if (_.isFunction(seedData)) {

    //evaluate function to obtain data
    seedData(function (error, data) {
      //current log error and continue
      //
      //TODO should we throw?
      if (error) {
        logger.error(error);
      }

      //invoke prepare with data
      else {
        //TODO push fn or seed obj & array

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
 * @param  {Object} seeds environment specific loaded seeds from the seeds 
 *                        directory
 * @return {Array} a collection of works to be performed during data loading
 * @private
 */
Seed.prototype.prepareWork = function (seeds) {
  //work to be done
  //in parallel during
  //data seeding
  var work = [];

  //prepare all seeds
  //data for parallel execution
  _.keys(seeds)
    .forEach(function (seed) {
      // deduce model name
      var modelName =
        seed.replace(new RegExp(this.options.suffix + '$'), '');

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
Seed.prototype.load = function (done) {
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
    filter: new RegExp('(.+' + config.suffix + ')\.js$'),
    excludeDirs: /^\.(git|svn)$/
  });

  //prepare seeding work to perfom
  var work = this.prepareWork(seeds);

  //if there is a work to perform
  if (_.size(work) > 0) {
    //now lets do the work
    //in parallel fashion
    async.parallel(work, function (error, results) {

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
module.exports = function (options) {

  //ensure singleton
  if (!Seed.singleton) {
    Seed.singleton = new Seed(options);
  }

  //extend options otherwise
  if (options && _.isPlainObject(options)) {
    Seed.singleton.options = _.merge({}, Seed.singleton.options, options);
  }

  return Seed.singleton;

};
