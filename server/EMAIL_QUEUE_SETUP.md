# Email and Queue System Setup Guide

## Overview
This guide helps you set up and troubleshoot the email and queue system for the Blood Bank Management System.

## Issues Fixed

### 1. Redis Connection Issues
- **Problem**: `MaxRetriesPerRequestError` due to Redis connection failures
- **Solution**: 
  - Added proper Redis connection configuration with retry limits
  - Implemented lazy connection to prevent startup failures
  - Added comprehensive error handling for Redis operations

### 2. Missing Process Handler Errors
- **Problem**: `Missing process handler for job type` errors
- **Solution**:
  - Fixed queue job type registration
  - Added proper job type handlers for both `daily-expiry-report` and `manual-expiry-report`
  - Implemented job cleanup to prevent duplicate scheduled jobs

### 3. Email Service Issues
- **Problem**: Email service initialization failures and poor error handling
- **Solution**:
  - Added proper initialization state management
  - Improved error handling and logging
  - Fixed transporter initialization logic

### 4. PDF Generation Issues
- **Problem**: Missing reports directory and file system errors
- **Solution**:
  - Added automatic reports directory creation
  - Implemented file existence verification
  - Enhanced error handling for PDF generation

## Environment Variables Required

Create a `.env` file in the server directory with these variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Admin Email for Reports
ADMIN_EMAIL=admin@bloodbank.com

# Report Configuration
REPORTS_DIR=./reports
NEAR_EXPIRY_DAYS=5

# Timezone
TIMEZONE=Asia/Kolkata
```

## Gmail Setup for Email

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

## Redis Setup

### Option 1: Local Redis (Development)
```bash
# Install Redis (Windows)
# Download from https://github.com/microsoftarchive/redis/releases

# Install Redis (Linux/Mac)
sudo apt-get install redis-server  # Ubuntu
brew install redis                 # Mac

# Start Redis
redis-server
```

### Option 2: Docker Redis (Recommended)
```bash
# Start Redis with Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use docker-compose (already configured)
docker-compose up redis
```

## Testing the System

### 1. Test Email Service
```bash
node test-email-queue.js
```

### 2. Test Queue Manually
```bash
# Using the API endpoint
curl -X POST http://localhost:5000/api/test/expiry/report/trigger
```

### 3. Check Logs
```bash
# Monitor logs in real-time
tail -f logs/error.log
tail -f logs/info.log
```

## Troubleshooting

### Redis Connection Issues
1. **Check Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Verify REDIS_URL**:
   ```bash
   echo $REDIS_URL
   # Should be: redis://localhost:6379
   ```

3. **Test Redis connection**:
   ```bash
   redis-cli -u redis://localhost:6379 ping
   ```

### Email Issues
1. **Check environment variables**:
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASS
   echo $ADMIN_EMAIL
   ```

2. **Verify Gmail settings**:
   - Ensure 2FA is enabled
   - Use app password, not regular password
   - Check if "Less secure app access" is disabled

3. **Test email configuration**:
   ```bash
   node -e "
   const transporter = require('./config/mailConfig');
   transporter.verify((error, success) => {
     if (error) console.log('Error:', error);
     else console.log('Success:', success);
     process.exit();
   });
   "
   ```

### Queue Issues
1. **Check queue status**:
   ```bash
   # Monitor queue jobs
   redis-cli
   > KEYS bull:expiry-report:*
   ```

2. **Clear failed jobs**:
   ```bash
   # In Redis CLI
   > DEL bull:expiry-report:failed
   > DEL bull:expiry-report:delayed
   ```

3. **Restart queue**:
   ```bash
   # Restart the server
   npm restart
   ```

## Production Deployment

### 1. Environment Variables
- Set `NODE_ENV=production`
- Use production Redis URL
- Configure production email settings
- Set proper timezone

### 2. Schedule Configuration
- Change cron schedule from `*/2 * * * *` (every 2 minutes) to `0 8 * * *` (daily at 8 AM)
- Update in `queues/expiry-queue.js`

### 3. Monitoring
- Set up log monitoring
- Configure email alerts for queue failures
- Monitor Redis memory usage

## File Structure
```
server/
├── config/
│   ├── redis.js          # Redis configuration
│   └── mailConfig.js     # Email configuration
├── services/
│   ├── email-service.js  # Email service
│   └── blood-expiry-service.js  # Expiry report service
├── queues/
│   └── expiry-queue.js   # Queue configuration
├── jobs/
│   └── expiry-report-job.js  # Job processor
├── lib/
│   └── pdfGenerator.js   # PDF generation
├── logs/                 # Log files
├── reports/              # Generated PDF reports
└── test-email-queue.js   # Test script
```

## Support

If you encounter issues:
1. Check the logs in `server/logs/`
2. Verify all environment variables are set
3. Test individual components using the test script
4. Ensure Redis and MongoDB are running
5. Check network connectivity for email sending
