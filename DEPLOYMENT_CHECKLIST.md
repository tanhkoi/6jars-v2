# Vercel Deployment Checklist

## Pre-Deployment ✅

- [ ] MongoDB Atlas account created and cluster set up
- [ ] MongoDB connection string copied (mongodb+srv://...)
- [ ] Code pushed to GitHub repository
- [ ] Vercel account created at vercel.com

## Deployment Steps

### 1. Connect to Vercel
- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Select project root (where package.json and vercel.json are located)

### 2. Configure Environment Variables
- [ ] Add environment variable:
  - Name: `MONGODB_URI`
  - Value: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/six-jars-budget`
- [ ] Click "Add"

### 3. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for deployment to complete (2-3 minutes)
- [ ] Note the deployment URL (e.g., https://six-jars-app-xyz.vercel.app)

## Post-Deployment Verification ✅

### Health Check
- [ ] Visit `/api/health` endpoint
- [ ] Should return: `{"status":"OK","message":"Six Jars Budget API is running on Vercel"}`

### Frontend
- [ ] Visit the main URL (e.g., https://six-jars-app-xyz.vercel.app)
- [ ] Page should load without console errors
- [ ] Check console for API warnings (might show "Could not sync with backend" on first run - OK)

### Basic Functionality
- [ ] Load budget data (should create default demo-user)
- [ ] Try adding income (Distribute Income)
- [ ] Try deposit/withdraw operations
- [ ] Check that data persists on page reload

### Network Requests
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Perform an action (deposit, withdraw, etc.)
- [ ] Should see POST request to `/api/budget/demo-user/...`
- [ ] Response status should be 200 (success)

## Troubleshooting Checklist

If things aren't working:

### API Errors (500)
- [ ] Check Vercel function logs
  - Go to Deployment → "View Logs"
  - Look for error messages
- [ ] Verify MongoDB connection string is correct
  - Special characters should NOT be URL-encoded in Vercel
  - Example: `username@123` should stay as `username@123`, NOT `username%40123`
- [ ] Verify MongoDB Atlas network access
  - Go to Network Access → add `0.0.0.0/0` to allow all IPs

### "Cannot find module" Errors
- [ ] Delete `node_modules` locally: `rm -r node_modules` (or delete folder)
- [ ] Run `npm install`
- [ ] Push to GitHub and redeploy

### Connection Timeouts
- [ ] Check MongoDB cluster is running (not paused)
- [ ] Try connecting directly with MongoDB Compass
- [ ] Verify username/password in connection string

### CORS Issues
- [ ] CORS headers are already configured in all API functions
- [ ] Frontend should automatically use `/api` endpoint on Vercel
- [ ] No additional CORS configuration needed

## Maintenance

### Regular Checks
- [ ] Monitor function invocation usage in Vercel dashboard
- [ ] Check MongoDB storage usage (go to Collections → Storage)
- [ ] Review Vercel Analytics for errors/performance

### Updates
- [ ] Keep dependencies updated: `npm update`
- [ ] Test locally before pushing to production
- [ ] Monitor deployment logs after updates

---

**Deployment Status:**
- [ ] Ready to deploy
- [ ] Deployed successfully
- [ ] Testing complete
- [ ] Production verified

**Deployment Date:** _______________
**Vercel URL:** _______________
**Notes:** _______________
