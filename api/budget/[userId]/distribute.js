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
  const { amount, note } = req.body;

  try {
    if (req.method === 'POST') {
      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      let budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      // Calculate distribution
      const distributions = {};
      let remaining = amount;
      const jarIds = Object.keys(budgetData.jars);

      jarIds.forEach((jarId, index) => {
        const jar = budgetData.jars[jarId];
        if (index === jarIds.length - 1) {
          distributions[jarId] = Math.round(remaining * 100) / 100;
        } else {
          const share = Math.round((amount * jar.percent / 100) * 100) / 100;
          distributions[jarId] = share;
          remaining -= share;
        }
      });

      // Apply distributions and record transactions
      const timestamp = new Date();
      Object.entries(distributions).forEach(([jarId, share]) => {
        if (share > 0) {
          budgetData.jars[jarId].balance += share;
          budgetData.transactions.push({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jarId,
            type: 'deposit',
            amount: share,
            note: note || `Distribution from income: $${amount}`,
            timestamp
          });
        }
      });

      await budgetData.save();
      return res.status(200).json({ success: true, distributions, budgetData });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Distribution failed', details: error.message });
  }
}
