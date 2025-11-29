const connectDB = require('../_lib/connectMongo');
const BudgetData = require('../_models/BudgetData');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await connectDB();

  const { userId } = req.query;

  try {
    if (req.method === 'GET') {
      let budgetData = await BudgetData.findOne({ userId });

      if (!budgetData) {
        // Create default budget data if doesn't exist
        budgetData = new BudgetData({
          userId,
          jars: {
            necessities: { id: 'necessities', balance: 0, percent: 50 },
            play: { id: 'play', balance: 0, percent: 10 },
            education: { id: 'education', balance: 0, percent: 10 },
            savings: { id: 'savings', balance: 0, percent: 10 },
            give: { id: 'give', balance: 0, percent: 10 },
            invest: { id: 'invest', balance: 0, percent: 10 }
          },
          transactions: [],
          theme: 'light'
        });
        await budgetData.save();
      }

      return res.status(200).json(budgetData);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget data', details: error.message });
  }
}
