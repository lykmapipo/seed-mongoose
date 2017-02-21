'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const async = require('async');
const inflection = require('inflection');
const seed = require(path.join(__dirname, 'lib', 'seed'));
const schemaGraph = require(path.join(__dirname, 'lib', 'schema_graph'));
let mongoose;

//TODO handle deep nested relations(follow relation)
//TODO 1 level deep only


/**
 * @name loadSeeds
 * @description loading seed's data into configured model persistent storage
 * @private
 * @type {Function}
 */
function loadSeeds(options) {
  //obtain logger
  const logger = options.logger;

  //deduce seeds path to use
  //based on current environment
  const seedsPath =
    path.join(options.cwd, options.path, options.environment);

  //log seed environment
  logger &&
    (logger.debug || logger.log)('start seeding %s data', options.environment);

  //log seed location
  logger && (logger.debug || logger.log)('seeding from %s', seedsPath);

  //load all seeds available
  //in   `seedsPath`
  const seeds = require('require-all')({
    dirname: seedsPath,
    filter: new RegExp('(.+' + options.suffix + ')\.js$'),
    excludeDirs: /^\.(git|svn)$/
  });

  //map with model name as a key
  //and seed as a value
  //to help in ordering seeding behavior
  let modelSeedMap = {};

  //create model name - seed map
  _.keys(seeds)
    .forEach(function (seed) {
      // deduce model name
      let modelName =
        seed.replace(new RegExp(options.suffix + '$'), '');

      //pluralize model global id if enable
      modelName = inflection.classify(modelName);

      //grab data to load
      //from the seed data attribute
      modelSeedMap[modelName] = seeds[seed];

    });

  return modelSeedMap;

}


function load(options, done) {

  //obtain logger
  const logger = options.logger;

  //load seeds
  const seeds = loadSeeds(options);

  //obtain model graph
  const graph = schemaGraph(mongoose);

  //obtain models
  const modelNames = _.map(graph, 'modelName');

  //prepare works
  let works = [];
  _.forEach(modelNames, function (modelName) {
    //get seed data
    let data = seeds[modelName];

    if (data) {

      works.push(function (next) {
        async.waterfall([
          function fetchSeedData(then) {
            if (_.isFunction(data)) {
              data(then);
            } else {
              then(null, data);
            }
          },
          function normalizeSeedData(data, then) {
            data = [].concat(data);
            _.compact(data);
            then(null, data);
          },
          function seedData(data, then) {
            seed.many({
              modelName: modelName,
              data: data
            }, then);
          }
        ], next);

      });

    }

  });

  _.compact(works);
  async.series(works, function (error, seeds) {
    // clear seeded cache
    seed.seeded = {};

    //clear mongoose
    seed.mongoose = undefined;

    //log seed environment
    logger &&
      (logger.debug || logger.log)('finish seeding %s data', options.environment);

    done(error, seeds);

  });

}


/**
 * @function
 * @description DRY data seeding for mongoose.
 * 
 * @param  {Object} options seed configurations
 */
exports = module.exports = function (options, done) {

  //normalize options
  if (_.isFunction(options)) {
    done = options;
    options = {};
  }

  //obtain provided mongoose
  mongoose = options.mongoose || require('mongoose');
  seed.mongoose = mongoose;
  delete options.mongoose;

  //defaults configurations
  options = _.merge({}, {
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
    logger: null,

    //detect seeding environment
    //default to development environment
    environment: _.get(process.env, 'NODE_ENV', 'development')

  }, options);

  load(options, done);

};
