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
  const { percentages } = req.body;

  try {
    if (req.method === 'PUT') {
      if (!percentages || typeof percentages !== 'object') {
        return res.status(400).json({ error: 'Invalid percentages object' });
      }

      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      let total = 0;
      Object.entries(percentages).forEach(([jarId, percent]) => {
        if (budgetData.jars[jarId]) {
          budgetData.jars[jarId].percent = percent;
          total += percent;
        }
      });

      if (total !== 100) {
        return res.status(400).json({ error: 'Percentages must total 100%' });
      }

      await budgetData.save();
      return res.status(200).json({ success: true, budgetData });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update percentages', details: error.message });
  }
}
