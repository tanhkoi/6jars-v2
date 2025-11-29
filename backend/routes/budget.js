const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BudgetData = require('../models/BudgetData');

// Middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// GET: Fetch user's budget data
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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

    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget data', details: error.message });
  }
});

// POST: Add income distribution
router.post('/:userId/distribute', 
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('note').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, note } = req.body;

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
      res.json({ success: true, distributions, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Distribution failed', details: error.message });
    }
  }
);

// POST: Deposit to jar
router.post('/:userId/deposit',
  body('jarId').isIn(['necessities', 'play', 'education', 'savings', 'give', 'invest']),
  body('amount').isFloat({ min: 0.01 }),
  body('note').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { jarId, amount, note } = req.body;

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
      res.json({ success: true, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Deposit failed', details: error.message });
    }
  }
);

// POST: Withdraw from jar
router.post('/:userId/withdraw',
  body('jarId').isIn(['necessities', 'play', 'education', 'savings', 'give', 'invest']),
  body('amount').isFloat({ min: 0.01 }),
  body('note').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { jarId, amount, note } = req.body;

      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      if (budgetData.jars[jarId].balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      budgetData.jars[jarId].balance -= amount;
      budgetData.transactions.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jarId,
        type: 'withdraw',
        amount,
        note: note || 'Withdrawal',
        timestamp: new Date()
      });

      await budgetData.save();
      res.json({ success: true, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Withdrawal failed', details: error.message });
    }
  }
);

// POST: Transfer between jars
router.post('/:userId/transfer',
  body('fromJarId').isIn(['necessities', 'play', 'education', 'savings', 'give', 'invest']),
  body('toJarId').isIn(['necessities', 'play', 'education', 'savings', 'give', 'invest']),
  body('amount').isFloat({ min: 0.01 }),
  body('note').optional().isString(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { fromJarId, toJarId, amount, note } = req.body;

      if (fromJarId === toJarId) {
        return res.status(400).json({ error: 'Cannot transfer to the same jar' });
      }

      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      if (budgetData.jars[fromJarId].balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      const timestamp = new Date();
      const JAR_NAMES = {
        necessities: 'Necessities',
        play: 'Play',
        education: 'Education',
        savings: 'Long-term Savings',
        give: 'Give',
        invest: 'Invest'
      };

      budgetData.jars[fromJarId].balance -= amount;
      budgetData.transactions.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jarId: fromJarId,
        type: 'transfer_out',
        amount,
        note: note || `Transfer to ${JAR_NAMES[toJarId]}`,
        relatedJar: toJarId,
        timestamp
      });

      budgetData.jars[toJarId].balance += amount;
      budgetData.transactions.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jarId: toJarId,
        type: 'transfer_in',
        amount,
        note: note || `Transfer from ${JAR_NAMES[fromJarId]}`,
        relatedJar: fromJarId,
        timestamp
      });

      await budgetData.save();
      res.json({ success: true, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Transfer failed', details: error.message });
    }
  }
);

// PUT: Update jar percentages
router.put('/:userId/percentages',
  body('percentages').isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { percentages } = req.body;

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
      res.json({ success: true, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update percentages', details: error.message });
    }
  }
);

// PUT: Update theme
router.put('/:userId/theme',
  body('theme').isIn(['light', 'dark']),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { theme } = req.body;

      const budgetData = await BudgetData.findOne({ userId });
      if (!budgetData) {
        return res.status(404).json({ error: 'Budget data not found' });
      }

      budgetData.theme = theme;
      await budgetData.save();
      res.json({ success: true, budgetData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update theme', details: error.message });
    }
  }
);

// DELETE: Clear transaction history
router.delete('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;

    const budgetData = await BudgetData.findOne({ userId });
    if (!budgetData) {
      return res.status(404).json({ error: 'Budget data not found' });
    }

    budgetData.transactions = [];
    await budgetData.save();
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history', details: error.message });
  }
});

// DELETE: Reset balances
router.delete('/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;

    const budgetData = await BudgetData.findOne({ userId });
    if (!budgetData) {
      return res.status(404).json({ error: 'Budget data not found' });
    }

    Object.keys(budgetData.jars).forEach(jarId => {
      budgetData.jars[jarId].balance = 0;
    });

    await budgetData.save();
    res.json({ success: true, message: 'Balances reset' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset balances', details: error.message });
  }
});

// PUT: Replace entire budget state (jars, transactions, theme)
router.put('/:userId/state', async (req, res) => {
  try {
    const { userId } = req.params;
    const { jars, transactions, theme } = req.body;

    let budgetData = await BudgetData.findOne({ userId });
    if (!budgetData) {
      return res.status(404).json({ error: 'Budget data not found' });
    }

    // Minimal validation
    if (!jars || typeof jars !== 'object') {
      return res.status(400).json({ error: 'Invalid jars object' });
    }

    // Ensure each jar has an id field matching its key
    const normalizedJars = {};
    Object.entries(jars).forEach(([jarId, jarData]) => {
      normalizedJars[jarId] = {
        ...jarData,
        id: jarId  // Auto-populate id from key
      };
    });

    // Assign provided state fields
    budgetData.jars = normalizedJars;
    budgetData.transactions = Array.isArray(transactions) ? transactions : budgetData.transactions;
    if (theme) budgetData.theme = theme;

    await budgetData.save();
    res.json({ success: true, budgetData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save state', details: error.message });
  }
});

module.exports = router;
