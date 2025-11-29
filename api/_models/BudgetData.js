const mongoose = require('mongoose');

// Schema for individual jar
const JarSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    enum: ['necessities', 'play', 'education', 'savings', 'give', 'invest']
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  percent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Schema for transactions
const TransactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  jarId: {
    type: String,
    required: true,
    enum: ['necessities', 'play', 'education', 'savings', 'give', 'invest']
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'transfer_in', 'transfer_out']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  note: {
    type: String,
    default: ''
  },
  relatedJar: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Main Budget Data schema
const BudgetDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    jars: {
      necessities: JarSchema,
      play: JarSchema,
      education: JarSchema,
      savings: JarSchema,
      give: JarSchema,
      invest: JarSchema
    },
    transactions: [TransactionSchema],
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

// Create index for userId
BudgetDataSchema.index({ userId: 1 });

// Update the updatedAt field before saving
BudgetDataSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BudgetData', BudgetDataSchema);
