const connectDB = require('../../_lib/connectMongo');
const BudgetData = require('../../_models/BudgetData');

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
    if (req.method === 'DELETE') {
      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      Object.keys(budgetData.jars).forEach(jarId => {
        budgetData.jars[jarId].balance = 0;
      });

      await budgetData.save();
      return res.status(200).json({ success: true, message: 'Balances reset' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset balances', details: error.message });
  }
}
