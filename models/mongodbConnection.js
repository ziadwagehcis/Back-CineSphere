const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoConnection = process.env.MONGODB_CONNECTION || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movies';
const dbName = process.env.DB_NAME || 'movies';

let client = null;
let clientPromise = null;

async function getClient() {
    if (!clientPromise) {
        client = new MongoClient(mongoConnection, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 20,
            minPoolSize: 2,
            retryWrites: true,
            retryReads: true
        });
        clientPromise = client.connect().then(c => {
            console.log(`[MongoDB] Successfully connected to: ${mongoConnection.replace(/\/\/.*@/, '//***@')}`);
            return c;
        }).catch(err => {
            clientPromise = null;
            console.error('[MongoDB] Connection error:', err.message);
            throw err;
        });
    }
    return clientPromise;
}

async function getDb() {
    const cl = await getClient();
    return cl.db(dbName);
}

async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        clientPromise = null;
    }
}

module.exports = {
    MongoClient,
    ObjectId,
    mongoConnection,
    dbName,
    getClient,
    getDb,
    closeConnection
};
