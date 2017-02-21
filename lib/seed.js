'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const async = require('async');
const hashObject = require('object-hash');
const schemaGraph = require(path.join(__dirname, '..', 'lib', 'schema_graph'));


/**
 * @name seeded
 * @description hash containing already seeded data
 *              
 *              It contain object hash as a key and object id as
 *              a value.
 *              
 * @type {Object}
 * @private
 */
exports.seeded = {};


/**
 * @name single
 * @description seed single model data based on it graph
 * @param  {Object}   options modelName, data and model graph to be
 *                            used in seeding
 * @param {String} options.modelName name of mongoose model to seed
 *                                   data into
 * @param {Object} options.data 	 data to seed into the model
 * @param {Object} options.graph 	 model relation graph
 * @param  {Function} done    a callback to invoke on seeding
 * @return {Object}           seeded data
 * @type {Function}
 * @public
 */
exports.single = function (options, done) {

  //require mongoose
  const mongoose = exports.mongoose || require('mongoose');

  //load schema graph
  let graph = _.merge({}, options.graph,
    _.find(schemaGraph(mongoose), { modelName: options.modelName }));

  //obtain model
  const Model = mongoose.model(options.modelName);

  //create data hash
  let data = options.data;
  const hash = hashObject(data);
  //ignore seeding if it has an object id
  if (data._id) {
    exports.seeded[hash] = data._id;
  }

  //ensure model not seeded yet
  if (!exports.seeded[hash]) {
    let series = {};

    //seed other ref(other model) parent
    if (!_.isEmpty(graph.parentRefs)) {
      _.forEach(graph.parentRefs, function (parentRef) {
        if (data[parentRef.path]) {
          series[parentRef.path] = function (next) {
            exports.single({
              modelName: parentRef.modelName,
              data: data[parentRef.path]
            }, function (error, seeded) {
              //update ref
              if (!error) {
                data[parentRef.path] = seeded._id;
              }
              next(error, seeded);
            });
          };
        }
      });
    }

    //seed self(same model) ref parent
    if (!_.isEmpty(graph.selfParentRefs)) {
      _.forEach(graph.selfParentRefs, function (selfParentRef) {
        if (data[selfParentRef]) {
          series[selfParentRef] = function (next) {
            exports.single({
              modelName: options.modelName,
              data: data[selfParentRef]
            }, function (error, seeded) {
              //update ref
              if (!error) {
                data[selfParentRef] = seeded._id;
              }
              next(error, seeded);
            });
          };
        }
      });
    }

    //seed ref child
    if (!_.isEmpty(graph.childRefs)) {
      _.forEach(graph.childRefs, function (childRef) {
        if (data[childRef.path]) {
          //seed kids in series
          series[childRef.path] = function (next) {
            exports.many({
              modelName: childRef.modelName,
              data: data[childRef.path]
            }, function (error, seeded) {
              if (!error) {
                data[childRef.path] = _.uniq(_.map(seeded, '_id'));
              }
              next(error, seeded);
            });
          };
        }
      });
    }

    //seed self ref child
    if (!_.isEmpty(graph.selfChildRefs)) {
      _.forEach(graph.selfChildRefs, function (selfChildRef) {
        if (data[selfChildRef]) {
          //seed kids in series
          series[selfChildRef] = function (next) {
            exports.many({
              modelName: options.modelName,
              data: data[selfChildRef]
            }, function (error, seeded) {
              if (!error) {
                data[selfChildRef] = _.uniq(_.map(seeded, '_id'));
              }
              next(error, seeded);
            });
          };
        }
      });
    }

    //seed data(self)
    series.self = function (next) {
      async.waterfall([
        function find(then) {
          //prepare find existing criteria
          let criteria = {};
          _.forEach(_.keys(data), function (field) {
            if (!_.isArray(data[field])) {
              criteria[field] = data[field];
            }
          });
          Model.findOne(criteria, then);
        },
        function create(found, then) {
          if (found) {
            then(null, found);
          } else {
            Model.create(data, then);
          }
        }
      ], next);
    };

    async.series(series, function (error, seeded) {
      //update hash
      if (!error) {
        exports.seeded[hash] = seeded.self._id;
      }
      //update self parent refs
      done(error, seeded.self);
    });

  }

  //ignore and continue
  else {
    data = _.merge({}, data, { _id: exports.seeded[hash] });
    done(null, data);
  }

};


/**
 * @name many
 * @description seed many model data based on it graph
 * @param  {Object}   options modelName, data and model graph to be
 *                            used in seeding
 * @param {String} options.modelName name of mongoose model to seed
 *                                   data into
 * @param {[Object]} options.data 	collection of data to seed into 
 *                                  the model
 * @param {Object} options.graph 	model relation graph
 * @param  {Function} done    a callback to invoke on seeding
 * @return {Object}           seeded data
 * @type {Function}
 * @public
 */
exports.many = function (options, done) {
  //normalize seeded data
  options = _.merge({}, options);
  options.data = _.compact([].concat(options.data));

  //prepare series seed data
  const seedSeries = _.map(options.data, function (data) {
    return function (next) {
      exports.single({
        modelName: options.modelName,
        data: data,
        graph: {}
      }, next);
    };
  });

  async.series(seedSeries, done);

};
