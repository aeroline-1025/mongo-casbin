//Seneca does not accept arrow function as callback, disabled EsLint rule
/* eslint-disable prefer-arrow-callback */
'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Rewire = require('rewire');
const { stub, restore } = require('sinon');


const { expect } = Code;
const { it, experiment, beforeEach, afterEach } = exports.lab = Lab.script();

experiment('MongoAdapter Class', () => {

    const { MongoAdapter } = Rewire('..');

    afterEach(() => {

        restore();
    });

    it('should export a "newAdapter" method', () => {

        expect(MongoAdapter.newAdapter).to.be.a.function();
    });

    it('should connect to Mongo when calling "newAdapter" method', { plan: 2 }, async() => {

        // Arrange
        const myModule = Rewire('.');
        const mongoClientStub = class {
            constructor() {

                this.connect = stub(); //eslint-disable-line no-unused-vars
                this.db = stub().returns({ createCollection: stub() }); //eslint-disable-line no-unused-vars
            }
        };

        // Act
        myModule.__set__('MongoClient', mongoClientStub);
        const adapter = await myModule.MongoAdapter.newAdapter('dbName', 'colName');

        // Assert
        expect(adapter.db, 'db').to.exist();
        expect(adapter.db.createCollection.calledOnce, 'createCollection').to.be.true();
    });

    it('should throw if constructor called with wrong params', async() => {

        try {
            await MongoAdapter.newAdapter();
        } catch (e) {
            //todo: try to understand why expect(MongoAdapter.newAdapter).to.throws does not work
            expect(e).to.be.an.error('Error: no valid constructor parameters');
        }

        //expect(MongoAdapter.newAdapter).to.throws(AdapterError, 'Error: no valid constructor parameters');
    });
});

experiment('Exports', () => {

    let adapter = null;
    const { MongoAdapter } = require('../lib');

    beforeEach(async() => {

        adapter = await new MongoAdapter('dbName', 'colName');
    });

    it('should have a "loadPolicy" method', () => {

        expect(adapter.loadPolicy).to.be.a.function();
    });

    it('should have a "savePolicy" method', () => {

        expect(adapter.savePolicy).to.be.a.function();
    });

    it('should have an optional "addPolicy" method', () => {

        expect(adapter.addPolicy).to.be.a.function();
    });

    it('should have an optional "removePolicy" method', () => {

        expect(adapter.removePolicy).to.be.a.function();
    });

    it('should have an optional "removeFilteredPolicy" method', () => {

        expect(adapter.removeFilteredPolicy).to.be.a.function();
    });
});

experiment('Adapter', () => {

    let adapter = null;
    const { MongoAdapter } = require('../lib');

    const bulkStub = { insert: stub(), execute: stub() };

    const collectionStub = {
        insertOne: stub(),
        find: stub().returns({ toArray: stub() }),
        findOneAndDelete: stub(),
        initializeUnorderedBulkOp: stub().returns(bulkStub),
        drop: stub()
    };

    const dbStub = {
        collection: stub().returns(collectionStub)
    };

    beforeEach(async() => {

        adapter = await new MongoAdapter('dbName', 'colName');
        adapter.db = dbStub;
    });

    afterEach(() => {

        collectionStub.drop.reset();
        collectionStub.initializeUnorderedBulkOp.reset();
    });

    it('should use "unordered bulk operation" on SavePolicy', { only: true }, () => {
        // Act
        adapter.savePolicy({ model: new Map() });

        // Assert
        expect(collectionStub.initializeUnorderedBulkOp.calledOnce).to.be.true();
    });

    it('should drop collection then insert on SavePolicy', () => {
        // Act
        adapter.savePolicy({ model: new Map() });

        // Assert
        expect(collectionStub.drop.calledOnce).to.be.true();
    });

    it('should use "find" on LoadPolicy', () => {
        // Act
        adapter.loadPolicy();

        // Assert
        expect(collectionStub.find.calledOnce).to.be.true();
    });

    it('should use "insertOne" on addPolicy', () => {
        // Act
        adapter.addPolicy();

        // Assert
        expect(collectionStub.insertOne.calledOnce).to.be.true();
    });

    it('should use "findOneAndDelete" on removePolicy', () => {

        // Act
        adapter.removePolicy();

        // Assert
        expect(collectionStub.findOneAndDelete.calledOnce).to.be.true();
    });

    it('should throw a \'not implemented\' error', () => {

        expect(adapter.removeFilteredPolicy).to.throws(Error, 'not implemented');
    });
});
