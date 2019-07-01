const MongoClient = require('mongodb').MongoClient;dir
const fs = require('fs');

class MongoAdapter {

    static async newAdapter(db, collection) {
        const adapter = new MongoAdapter(db, collection);
        await adapter.connectDb();
        return adapter
    }

    constructor(db, collection) {
        this.dbName = db;
        this.collectionName = collection;
    }

    async connectDb() {
        // Connection URL
        const url = `mongodb://localhost:27017/${this.dbName}`;

        const client = new MongoClient(url, {useNewUrlParser: true});

        try {
            // Use connect method to connect to the Server
            await client.connect();

            this.db = client.db(this.dbName);
            await this.db.createCollection(this.collectionName);
        } catch (err) {
            console.error(err.stack);
        }
    }

    async loadPolicy(model) {
        const policyDocs = await this.db.collection(this.collectionName).find().toArray();
        console.log('processing lines');
        for (let line of policyDocs) {

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
                console.error(`Error loading policy: ${JSON.stringify( line)}\nStack:${err.stack}` );
            }
        }
    }

    async savePolicy(model) {
        try { //Cleanup collection
            await this.db.collection(this.collectionName).drop();

            //Process all "p" policies from model
            let astMap = model.model.get('p');
            for (const [ptype, ast] of astMap) {
                for (const rule of ast.policy) {
                    await this.addPolicy(ptype, ptype, rule);
                }
            }
            //Process all "g" policies from model
            astMap = model.model.get('g');
            for (const [ptype, ast] of astMap) {
                for (const rule of ast.policy) {
                    await this.addPolicy(ptype, ptype, rule);
                }
            }
        } catch (err) {
            throw new Error('mongoAdapter: savePolicy');
        }
    }

    async addPolicy(sec, ptype, rule) {
        const policyDocs = await this.db.collection(this.collectionName).insertOne({ptype: ptype, args: rule});
    }

    async removePolicy(sec, ptype, rule) {
        const policyDocs = await this.db.collection(this.collectionName).findOneAndDelete({ptype: ptype, args: rule});
    }

    removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {
        throw new Error('not implemented');
    }
}

module.exports = MongoAdapter;
