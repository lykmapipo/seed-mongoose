'use strict';

/**
 * @module graph
 * @description generate schema graph based on their dependencies from
 *              registered mongoose models
 * @since  0.4.3
 * @version 0.5.0
 * @public
 */


//dependencies
const _ = require('lodash');


/**
 * @name parentRefs
 * @type {Function}
 * @description iterate through schema definition to obtain refs pointing to 
 *              other schema type but act as parent(belongs to)
 * @param  {Schema} schema valid mongoose schema
 * @param {[String]} modelNames collection of registered mongoose model names
 * @return {[String]}      
 */
function parentRefs(modelName, schema, modelNames) {
  let refs = [];
  //
  //iterate over schema path to obtain refs
  schema.eachPath(function (path, schemaType) {
    //
    //ensure schema instance is object
    const isObjectId = _.get(schemaType, 'instance') === 'ObjectID';
    //
    //check if it has a reference
    const ref = _.get(schemaType, 'options.ref');
    //
    //ensure ref exists as a model
    const isRefAModel = _.indexOf(modelNames, ref) > -1;
    //
    //collect refs
    if (isObjectId && isRefAModel && ref !== modelName) {
      refs.push({ path: path, modelName: ref });
    }
  });

  return _.compact(refs);
}


/**
 * @name childRefs
 * @type {Function}
 * @description iterate through schema definition to obtain refs pointing to 
 *              other schema type but ach as children(s)
 * @param  {Schema} schema valid mongoose schema
 * @param {[String]} modelNames collection of registered mongoose model names
 * @return {[String]}      
 */
function childRefs(modelName, schema, modelNames) {
  let refs = [];
  //
  //iterate over schema path to obtain refs
  schema.eachPath(function (path, schemaType) {
    //
    //ensure schema instance is object
    const isObjectId =
      _.get(schemaType, 'caster.instance') === 'ObjectID';
    //
    //check if it has a reference
    const ref = _.get(schemaType, 'options.ref') ||
      _.get(schemaType, 'caster.options.ref');
    //
    //ensure ref exists as a model
    const isRefAModel = _.indexOf(modelNames, ref) > -1;
    //
    //collect refs
    if (isObjectId && isRefAModel && ref !== modelName) {
      refs.push({ path: path, modelName: ref });
    }
  });

  return refs;
}


/**
 * @name selfParentRefs
 * @type {Function}
 * @description iterate through schema definition to obtain refs pointing to 
 *              self schema type but act as children(s)
 * @param  {Schema} schema valid mongoose schema
 * @param {[String]} modelNames collection of registered mongoose model names
 * @return {[String]}      
 */
function selfParentRefs(modelName, schema, modelNames) {
  let refs = [];
  //
  //iterate over schema path to obtain direct self refs
  schema.eachPath(function (path, schemaType) {
    //
    //ensure schema instance is object
    const isObjectId = _.get(schemaType, 'instance') === 'ObjectID';
    //
    //check if it has a reference
    const ref = _.get(schemaType, 'options.ref');
    //
    //ensure ref exists as a model
    const isRefAModel = _.indexOf(modelNames, ref) > -1;
    //
    //collect self refs
    if (isObjectId && isRefAModel && ref === modelName) {
      refs.push(path);
    }
  });

  return _.compact(refs);
}


/**
 * @name selfChildRefs
 * @type {Function}
 * @description iterate through schema definition to obtain refs pointing to 
 *              self schema type but act as parent(belongs to)
 * @param  {Schema} schema valid mongoose schema
 * @param {[String]} modelNames collection of registered mongoose model names
 * @return {[String]}      
 */
function selfChildRefs(modelName, schema, modelNames) {
  let refs = [];
  //
  //iterate over schema path to obtain direct self refs
  schema.eachPath(function (path, schemaType) {
    //
    //ensure schema instance is object
    const isObjectId =
      _.get(schemaType, 'caster.instance') === 'ObjectID';
    //
    //check if it has a reference
    const ref = _.get(schemaType, 'options.ref') ||
      _.get(schemaType, 'caster.options.ref');
    //
    //ensure ref exists as a model
    const isRefAModel = _.indexOf(modelNames, ref) > -1;
    //
    //collect self refs
    if (isObjectId && isRefAModel && ref === modelName) {
      refs.push(path);
    }
  });

  return _.compact(refs);
}


module.exports = function (mongoose) {
  //extend mongoose with graph capability
  if (!mongoose.graph) {

    //extend mongoose with schema graph capabilities
    mongoose.schemaGraph = function () {

      //collect model graph
      const graph = {};

      //start graphing at the top of all models
      //
      //ensure unique modelNames
      const modelNames = _.uniq(this.modelNames());
      //
      // iterate over model names to build graph
      modelNames.forEach(function (modelName) {
        //obtain model and schema
        const Model = mongoose.model(modelName);
        const schema = Model.schema;
        if (Model && schema) {
          graph[modelName] = {
            selfParentRefs: selfParentRefs(modelName, schema,
              modelNames),
            selfChildRefs: selfChildRefs(modelName, schema,
              modelNames),
            parentRefs: parentRefs(modelName, schema,
              modelNames),
            childRefs: childRefs(modelName, schema,
              modelNames)
          };
        }
      });

      return graph;

    };

  }

};
