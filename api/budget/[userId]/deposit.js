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
  const { jarId, amount, note } = req.body;

  try {
    if (req.method === 'POST') {
      const validJarIds = ['necessities', 'play', 'education', 'savings', 'give', 'invest'];
      
      if (!validJarIds.includes(jarId)) {
        return res.status(400).json({ error: 'Invalid jar ID' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      budgetData.jars[jarId].balance += amount;
      budgetData.transactions.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jarId,
        type: 'deposit',
        amount,
        note: note || 'Manual deposit',
        timestamp: new Date()
      });

      await budgetData.save();
      return res.status(200).json({ success: true, budgetData });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed', details: error.message });
  }
}
