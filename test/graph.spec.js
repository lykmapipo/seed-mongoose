'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = require('chai').expect;
require(path.join(__dirname, '..', 'lib', 'schema_graph'));

describe('schema graph', function () {

  it('should be a function', function () {
    expect(mongoose.schemaGraph).to.exist;
    expect(mongoose.schemaGraph).to.be.a('function');
  });

  it('should be able to build graph from flat schema', function () {

    const FlatSchema = new Schema({
      name: {
        type: String
      }
    });
    mongoose.model('Flat', FlatSchema);
    const graph = mongoose.schemaGraph();

    expect(graph).to.be.an('array');

    const graphed = _.find(graph, { modelName: 'Flat' });
    expect(graphed.modelName).to.include('Flat');
    expect(graphed.score).to.equal(1000);

  });

  describe('self refs', function () {

    before(function () {
      const SelfFlatSchema = new Schema({
        name: {
          type: String
        },
        parent: {
          type: ObjectId,
          ref: 'SelfFlat'
        },
        wrong: {
          type: ObjectId,
          ref: 'WrongFlat'
        },
        childrens: [{
          type: ObjectId,
          ref: 'SelfFlat'
        }],
        kids: {
          type: [ObjectId],
          ref: 'SelfFlat'
        }
      });
      mongoose.model('SelfFlat', SelfFlatSchema);
    });

    it('should be able to build graph from parent self ref',
      function () {

        const graph = mongoose.schemaGraph();

        expect(graph).to.be.an('array');
        expect(_.map(graph, 'modelName')).to.include('SelfFlat');

        const selfFlat = _.find(graph, { modelName: 'SelfFlat' });
        expect(selfFlat.selfParentRefs).to.include('parent');
        expect(selfFlat.selfParentRefs).to.not.include('wrong');

      });

    it('should be able to build graph from array child self ref',
      function () {

        const graph = mongoose.schemaGraph();

        expect(graph).to.be.an('array');
        expect(_.map(graph, 'modelName')).to.include('SelfFlat');

        const selfFlat = _.find(graph, { modelName: 'SelfFlat' });
        expect(selfFlat.selfChildRefs)
          .to.include.members(['kids', 'childrens']);

      });

  });

  describe('schema refs', function () {

    before(function () {
      const RefSchema = new Schema({
        parent: {
          type: ObjectId,
          ref: 'Flat'
        },
        kids: {
          type: [ObjectId],
          ref: 'SelfFlat'
        }
      });
      mongoose.model('Ref', RefSchema);
    });

    it('should be able to build graph from direct ref', function () {
      const graph = mongoose.schemaGraph();

      expect(graph).to.be.an('array');
      expect(_.map(graph, 'modelName')).to.include('Ref');

      const ref = _.find(graph, { modelName: 'Ref' });
      expect(ref.parentRefs).to.have.length(1);
      expect(ref.parentRefs[0].path).be.equal('parent');
      expect(ref.parentRefs[0].modelName).be.equal('Flat');

      expect(ref.childRefs).to.have.length(1);
      expect(ref.childRefs[0].path).be.equal('kids');
      expect(ref.childRefs[0].modelName).be.equal('SelfFlat');

    });

  });

});
