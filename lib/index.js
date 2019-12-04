'use strict';

const MongoClient = require('mongodb').MongoClient;

class AdapterError extends Error {

    constructor(...args) {

        super(...args);
    }
}

class MongoAdapter {

    static async newAdapter(db, collection) {

        try {
            const adapter = new MongoAdapter(db, collection);
            await adapter.connectDb();
            return adapter;
        } catch (e) {
            throw new AdapterError(e);
        }
    }

    constructor(db, collection) {

        //eslint-disable-next-line eqeqeq
        if (db == undefined || collection == undefined) {
            throw new AdapterError('no valid constructor parameters');
        }

        this.dbName = db;
        this.collectionName = collection;
    }

    async connectDb() {

        // Connection URL
        const url = `mongodb://localhost:27017/${this.dbName}`;

        const client = new MongoClient(url, { useNewUrlParser: true });

        // Use connect method to connect to the Server
        await client.connect();

        this.db = client.db(this.dbName);
        await this.db.createCollection(this.collectionName);

    }

    async loadPolicy(model) {

        const policyDocs = await this.db.collection(this.collectionName).find().toArray();

        for (const line of policyDocs) {

            try {
                const key = line.ptype;
                const sec = key.substring(0, 1);
                const item = model.model.get(sec);
                if (!item) {
                    return;
                }

                const policy = item.get(key);
                if (!policy) {
                    return;
                }

                policy.policy.push(line.args);
            } catch (err) {
                throw new AdapterError('Error loading policy');
            }
        }
    }

    async savePolicy(model) {

        try { //Cleanup collection
            await this.db.collection(this.collectionName).drop();
            const bulker = this.db.collection(this.collectionName).initializeUnorderedBulkOp();

            //Process all "p" policies from model
            let astMap = model.model.get('p');
            for (const [ptype, ast] of astMap) {
                for (const rule of ast.policy) {
                    bulker.insert({ ptype, args: rule });
                }
            }

            //Process all "g" policies from model
            astMap = model.model.get('g');

            for (const [ptype, ast] of astMap) {
                for (const rule of ast.policy) {
                    bulker.insert({ ptype, args: rule });
                }
            }

            await bulker.execute();
        } catch (err) {

            throw new AdapterError('mongoAdapter: savePolicy');
        }
    }

    async addPolicy(sec, ptype, rule) {

        await this.db.collection(this.collectionName).insertOne({ ptype, args: rule });
    }

    async removePolicy(sec, ptype, rule) {

        await this.db.collection(this.collectionName).findOneAndDelete({ ptype, args: rule });
    }

    removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {

        throw new AdapterError('not implemented');
    }
}

module.exports = {
    MongoAdapter,
    AdapterError
};
