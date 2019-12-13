'use strict';

const MongoClient = require('mongodb').MongoClient;
const Joi = require('@hapi/joi');

const OPTIONS_SCHEMA = Joi.object({
    db: Joi.string().required(),
    collection: Joi.string().required(),
    user: Joi.string().optional(),
    password: Joi.string().optional(),
    host: Joi.string().default('localhost').optional(),
    port: Joi.number().default(27017).optional()
});

class AdapterError extends Error {

    constructor(...args) {

        super(...args);
    }
}

class MongoAdapter {

    static async newAdapter(options) {

        try {
            const adapter = new MongoAdapter(options);
            await adapter.connectDb();
            return adapter;
        } catch (e) {
            throw new AdapterError(e);
        }
    }

    constructor(options) {

        //eslint-disable-next-line eqeqeq
        try {
            Joi.assert(options, OPTIONS_SCHEMA, { abortEarly: false });
        } catch (e) {
            throw new AdapterError('no valid constructor parameters');
        }

        this.dbOptions = options;
    }

    async connectDb() {

        // Connection URL
        let userStr = '';
        if (this.dbOptions.user && this.dbOptions.password) {
            userStr = `${this.dbOptions.user}:${this.dbOptions.password}@`;
        }

        const url = `mongodb://${userStr}${this.dbOptions.host}:${this.dbOptions.port}/${this.dbOptions.db}`;

        const client = new MongoClient(url, { useNewUrlParser: true });

        // Use connect method to connect to the Server
        await client.connect();

        this.db = client.db(this.dbOptions.db);
        await this.db.createCollection(this.dbOptions.collection);

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
