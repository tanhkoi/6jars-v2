// initDemoUser.mongo.js
// Usage (mongosh):
//   mongosh "mongodb://localhost:27017/sixjars" initDemoUser.mongo.js

// NOTE: Adjust DB name in `use` line if your DB name differs.

// use sixjars

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

// Upsert the document
db.getCollection('budgetdatas').updateOne(
  { userId: doc.userId },
  { $set: doc },
  { upsert: true }
);

print('Upsert completed for demo-user in collection budgetdatas');
