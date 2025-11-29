# Six Jars Budget Manager - Vercel Deployment Guide

## Overview

This project has been converted to run on **Vercel** with serverless functions. The entire backend is now hosted as Vercel Functions (API routes), and the frontend (`frontend/index.html`) is a static site.

## Project Structure

```
six-jars-app/
├── frontend/
│   └── index.html              # Static frontend (deployed to Vercel)
├── api/
│   ├── _lib/
│   │   └── connectMongo.js     # MongoDB connection caching helper
│   ├── _models/
│   │   └── BudgetData.js       # Mongoose schema for budget data
│   ├── health.js               # Health check endpoint (/api/health)
│   └── budget/
│       ├── [userId].js         # GET /api/budget/[userId]
│       └── [userId]/
│           ├── distribute.js   # POST /api/budget/[userId]/distribute
│           ├── deposit.js      # POST /api/budget/[userId]/deposit
│           ├── withdraw.js     # POST /api/budget/[userId]/withdraw
│           ├── transfer.js     # POST /api/budget/[userId]/transfer
│           ├── percentages.js  # PUT /api/budget/[userId]/percentages
│           ├── theme.js        # PUT /api/budget/[userId]/theme
│           ├── history.js      # DELETE /api/budget/[userId]/history
│           ├── reset.js        # DELETE /api/budget/[userId]/reset
│           └── state.js        # PUT /api/budget/[userId]/state
├── backend/                    # (Original Express app - kept for reference)
├── package.json                # Root dependencies for Vercel
├── vercel.json                 # Vercel configuration
└── .env.example                # Environment variables template
```

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas** - Free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create a database user and get your connection string

## Step 1: Set Up MongoDB

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier is free)
3. Create a database user (note: username and password)
4. Click "Connect" and select "Connect your application"
5. Copy the connection string, it should look like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/six-jars-budget
   ```
6. **Important:** Replace `username` and `password` with your actual credentials
7. Keep this string handy for Step 3

## Step 2: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Convert to Vercel serverless functions"

# Add your GitHub repo remote and push
git remote add origin https://github.com/YOUR_USERNAME/six-jars-app.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel UI (Recommended for Beginners)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your repo
3. Choose **Personal Account** as scope
4. Click **"Import"**
5. In the **Environment Variables** section, add:
   - **Name:** `MONGODB_URI`
   - **Value:** Paste your MongoDB connection string from Step 1
   - Click **"Add"**
6. Click **"Deploy"**
7. Wait ~2-3 minutes for deployment to complete
8. You'll see a URL like `https://six-jars-app-xyz.vercel.app`

### Option B: Via Vercel CLI (For Advanced Users)

```bash
# Install Vercel CLI
npm install -g vercel

# Log in to Vercel
vercel login

# Deploy the project
vercel --prod

# When prompted for settings, use defaults
# When prompted to set environment variables:
# - Enter MONGODB_URI as the variable name
# - Paste your MongoDB connection string
```

## Step 4: Verify Deployment

1. Visit your Vercel URL (e.g., `https://six-jars-app-xyz.vercel.app`)
2. Check the health endpoint: `https://your-app.vercel.app/api/health`
3. You should see: `{"status":"OK","message":"Six Jars Budget API is running on Vercel"}`

## API Endpoints

All endpoints are now under `/api/`:

- **GET** `/api/health` - Health check
- **GET** `/api/budget/[userId]` - Fetch budget data
- **POST** `/api/budget/[userId]/distribute` - Distribute income
- **POST** `/api/budget/[userId]/deposit` - Add to jar
- **POST** `/api/budget/[userId]/withdraw` - Withdraw from jar
- **POST** `/api/budget/[userId]/transfer` - Transfer between jars
- **PUT** `/api/budget/[userId]/percentages` - Update jar percentages
- **PUT** `/api/budget/[userId]/theme` - Set theme (light/dark)
- **PUT** `/api/budget/[userId]/state` - Replace entire state
- **DELETE** `/api/budget/[userId]/history` - Clear transactions
- **DELETE** `/api/budget/[userId]/reset` - Reset all balances

### Example Request

```bash
curl -X POST https://your-app.vercel.app/api/budget/demo-user/distribute \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "note": "Monthly paycheck"}'
```

## Frontend Configuration

The frontend automatically detects the environment:

- **Local development:** Uses `http://localhost:5000/api` (Express backend)
- **Vercel deployment:** Uses `/api` (serverless functions)

No changes needed! The frontend file is automatically configured.

## Local Development

To test locally before deployment:

### 1. Start MongoDB Locally (Optional)
```bash
# If using local MongoDB
mongod
```

### 2. Set Up Environment Variables
```bash
# Create .env.local in project root
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/six-jars-budget
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 4. Run Vercel Dev Server
```bash
npm install -g vercel  # if not already installed
vercel dev
```

This starts both the frontend and API functions locally on http://localhost:3000

### 5. Access the App
Open http://localhost:3000 in your browser

## Troubleshooting

### "MONGODB_URI is not defined"
- Check that the environment variable is set in Vercel dashboard
- Go to **Project Settings** → **Environment Variables**
- Verify the variable name is exactly `MONGODB_URI`

### "Connection timeout" errors
- Verify your MongoDB connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas (Network Access)
- For Atlas: click **Network Access** and add `0.0.0.0/0` to allow all IPs

### "Cannot find module" errors
- Delete `node_modules` and `.next` (if exists)
- Run `npm install` in the root directory
- Redeploy to Vercel

### API returns 500 error
- Check Vercel function logs: **Deployments** → **View Logs**
- Look for MongoDB connection or runtime errors
- Verify `.env` variables are set correctly

## Important Notes

### Connection Pooling
The MongoDB connection is **cached globally** in the serverless functions to avoid connection limits. Each function reuses the connection across invocations. This is critical for serverless environments.

### Cold Starts
Serverless functions may have a slight delay on first invocation (cold start). Subsequent requests are much faster. For production, consider:
- Using MongoDB Atlas M2+ tier (better connection pooling)
- Adding a periodic "ping" to keep functions warm

### Costs
- **Vercel:** Free tier includes 1000 function invocations per month (sufficient for testing)
- **MongoDB Atlas:** M0 (free) includes 512 MB storage and 100 connections
- **Bandwidth:** Free for up to 100 GB/month on Vercel

## Next Steps

1. **Custom Domain:** Add your domain in Vercel project settings
2. **Authentication:** Implement user login (currently uses `demo-user`)
3. **Backups:** Enable MongoDB automated backups in Atlas
4. **Monitoring:** Set up Vercel Analytics for performance tracking

## File Reference

- `vercel.json` - Vercel deployment configuration
- `package.json` - Root dependencies (mongoose, express, cors, etc.)
- `.env.example` - Template for environment variables
- `api/_lib/connectMongo.js` - Serverless MongoDB connection handler
- `api/_models/BudgetData.js` - Mongoose schema (copied from backend)

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Help](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)

---

**Deployed successfully?** 🎉 Your Six Jars Budget Manager is now live on Vercel!
