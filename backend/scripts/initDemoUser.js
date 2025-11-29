#!/usr/bin/env node
// initDemoUser.js
// Usage (Windows cmd):
//   set MONGO_URI=mongodb://localhost:27017/sixjars
//   node backend\scripts\initDemoUser.js
// Or provide MONGO_URI env var with DB name; defaults to mongodb://localhost:27017/sixjars

const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sixjars';

function getDbNameFromUri(u) {
  try {
    // look for final path segment after last '/'
    const idx = u.lastIndexOf('/');
    if (idx === -1) return 'sixjarsapp';
    const dbName = u.substring(idx + 1) || 'sixjarsapp';
    // strip query params if any
    return dbName.split('?')[0];
  } catch (e) {
    return 'sixjarsapp';
  }
}

(async () => {
  const dbName = getDbNameFromUri(uri);
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB at', uri);
    const db = client.db(dbName);
    const coll = db.collection('budgetdatas');

    const timestamp = Date.now();

    const doc = {
      userId: 'demo-user',
      jars: {
        necessities: { id: 'necessities', balance: 200, percent: 50 },
        play:       { id: 'play',       balance: 50,  percent: 10 },
        education:  { id: 'education',  balance: 0,   percent: 10 },
        savings:    { id: 'savings',    balance: 100, percent: 10 },
        give:       { id: 'give',       balance: 20,  percent: 10 },
        invest:     { id: 'invest',     balance: 30,  percent: 10 }
      },
      transactions: [
        { id: 'sample-1', jarId: 'necessities', type: 'deposit', amount: 200, note: 'Initial balance', timestamp: new Date(timestamp - 86400000) },
        { id: 'sample-2', jarId: 'play',        type: 'deposit', amount: 50,  note: 'Initial balance', timestamp: new Date(timestamp - 86400000) },
        { id: 'sample-3', jarId: 'savings',     type: 'deposit', amount: 100, note: 'Initial balance', timestamp: new Date(timestamp - 86400000) },
        { id: 'sample-4', jarId: 'give',        type: 'deposit', amount: 20,  note: 'Initial balance', timestamp: new Date(timestamp - 86400000) },
        { id: 'sample-5', jarId: 'invest',      type: 'deposit', amount: 30,  note: 'Initial balance', timestamp: new Date(timestamp - 86400000) }
      ],
      theme: 'light',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Upsert document for demo-user (replace existing structure)
    const res = await coll.updateOne(
      { userId: doc.userId },
      { $set: doc },
      { upsert: true }
    );

    if (res.upsertedId) {
      console.log('Inserted new demo-user document with id', res.upsertedId._id);
    } else if (res.matchedCount) {
      console.log('Updated existing demo-user document');
    } else {
      console.log('Operation completed:', res.result || res);
    }

    console.log('\nCreated/updated demo-user in collection `budgetdatas` (DB:', dbName + ')');
  } catch (err) {
    console.error('Error initializing demo-user:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
