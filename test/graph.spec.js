'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = require('chai').expect;
require(path.join(__dirname, '..', 'lib', 'schema_graph'))(mongoose);

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

    expect(graph).to.be.an('object');
    expect(_.keys(graph)).to.include('Flat');

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

        expect(graph).to.be.an('object');
        expect(_.keys(graph)).to.include('SelfFlat');
        expect(graph.SelfFlat.selfParentRefs).to.include('parent');
        expect(graph.SelfFlat.selfParentRefs).to.not.include('wrong');

      });

    it('should be able to build graph from array child self ref',
      function () {

        const graph = mongoose.schemaGraph();

        expect(graph).to.be.an('object');
        expect(_.keys(graph)).to.include('SelfFlat');
        expect(graph.SelfFlat.selfChildRefs)
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

      expect(graph).to.be.an('object');
      expect(_.keys(graph)).to.include('Ref');

      expect(graph.Ref.parentRefs).to.have.length(1);
      expect(graph.Ref.parentRefs[0].path).be.equal('parent');
      expect(graph.Ref.parentRefs[0].modelName).be.equal('Flat');

      expect(graph.Ref.childRefs).to.have.length(1);
      expect(graph.Ref.childRefs[0].path).be.equal('kids');
      expect(graph.Ref.childRefs[0].modelName).be.equal('SelfFlat');

    });

  });

});
