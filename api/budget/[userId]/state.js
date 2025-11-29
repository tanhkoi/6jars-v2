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
  const { jars, transactions, theme } = req.body;

  try {
    if (req.method === 'PUT') {
      if (!jars || typeof jars !== 'object') {
        return res.status(400).json({ error: 'Invalid jars object' });
      }

      let budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      // Normalize jars - ensure each jar has an id field matching its key
      const normalizedJars = {};
      Object.entries(jars).forEach(([jarId, jarData]) => {
        normalizedJars[jarId] = {
          ...jarData,
          id: jarId
        };
      });

      // Assign provided state fields
      budgetData.jars = normalizedJars;
      budgetData.transactions = Array.isArray(transactions) ? transactions : budgetData.transactions;
      if (theme) budgetData.theme = theme;

      await budgetData.save();
      return res.status(200).json({ success: true, budgetData });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save state', details: error.message });
  }
}
