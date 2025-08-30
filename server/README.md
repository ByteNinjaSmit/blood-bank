# Blood Bank Management System - Server

## Overview
This is the backend server for the Blood Bank Management System, providing APIs for managing blood donations, components, inventory, and automated expiry reporting.

## Recent Fixes and Improvements

### 1. Fixed Server Crashes
- **Issue**: Server was crashing due to missing error handling in test routes and queue processing
- **Fix**: Added comprehensive error handling and validation throughout the application
- **Files Modified**: 
  - `controllers/test-controller.js`
  - `queues/expiry-queue.js`
  - `jobs/expiry-report-job.js`
  - `middlewares/error-middleware.js`

### 2. Enhanced Near Expiry System
- **Issue**: Generic expiry thresholds not suitable for different component types
- **Fix**: Implemented component-specific thresholds:
  - Platelets: 1 day (critical)
  - RBC: 7 days
  - FFP: 30 days
  - Cryo: 30 days
- **Files Modified**: 
  - `services/blood-expiry-service.js`
  - `lib/pdfGenerator.js`

### 3. Professional PDF Reports
- **Issue**: Basic PDF generation without proper formatting
- **Fix**: Created professional PDF reports with:
  - Blood Bank header and branding
  - Summary section by component type and blood group
  - Detailed component listing with all relevant fields
  - Proper pagination and formatting
  - Footer with generation timestamp
- **Files Modified**: `lib/pdfGenerator.js`

### 4. Improved Email System
- **Issue**: Basic email functionality without proper error handling
- **Fix**: Enhanced email service with:
  - Proper error handling and logging
  - Professional email templates
  - Attachment support for PDF reports
- **Files Modified**: `services/email-service.js`

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/BloodBank

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@bloodbank.com

# Server Configuration
PORT=5000
NODE_ENV=development

# Report Configuration
REPORTS_DIR=./reports
NEAR_EXPIRY_DAYS=5

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Timezone
TIMEZONE=Asia/Kolkata
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Components
- `POST /api/components/separate` - Separate components from donation
- `GET /api/components/list` - List all components
- `GET /api/components/:id` - Get component details
- `GET /api/components/near-expiry` - Get near expiry components
- `PATCH /api/components/:id/status` - Update component status

### Test Routes
- `POST /api/test/send-email` - Send test email
- `POST /api/test/expiry/report/trigger` - Manually trigger expiry report

### Other Routes
- `GET /api/site` - Site management
- `GET /api/donor` - Donor management
- `GET /api/donation` - Donation management
- `GET /api/hospitals` - Hospital management
- `GET /api/inventory` - Inventory management

## Automated Features

### Daily Expiry Reports
- **Schedule**: Every day at 08:00 IST
- **Function**: Generates PDF report of components nearing expiry
- **Email**: Sends report to admin email with attachment
- **Thresholds**: Component-specific expiry thresholds

### Queue System
- **Technology**: Bull Queue with Redis
- **Features**: 
  - Automatic retry on failure
  - Job monitoring and logging
  - Manual trigger capability

## File Structure

```
server/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── jobs/            # Background job processors
├── lib/             # Utility libraries
├── middlewares/     # Express middlewares
├── models/          # MongoDB models
├── queues/          # Queue definitions
├── reports/         # Generated PDF reports
├── routers/         # API routes
├── services/        # Business logic services
├── uploads/         # File uploads
└── utils/           # Utility functions
```

## Error Handling

The application includes comprehensive error handling:

1. **Validation Errors**: Proper validation for all inputs
2. **Database Errors**: MongoDB connection and query error handling
3. **Email Errors**: SMTP error handling and logging
4. **Queue Errors**: Redis connection and job processing error handling
5. **File Errors**: PDF generation and file system error handling

## Logging

The application uses Winston for logging with the following features:

- **Console Logging**: Colored output for development
- **File Logging**: Separate files for different log levels
- **Error Tracking**: Detailed error logging with stack traces
- **Request Logging**: All API requests are logged

## Security Features

- **Rate Limiting**: IP-based rate limiting for API endpoints
- **CORS Protection**: Configured CORS policy
- **Helmet**: Security headers
- **Input Validation**: Comprehensive input validation
- **JWT Authentication**: Secure token-based authentication

## Monitoring

- **Health Checks**: Server health monitoring
- **Queue Monitoring**: Job queue status monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and performance metrics

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis server is running
   - Check REDIS_URL environment variable

2. **Email Sending Failed**
   - Verify EMAIL_USER and EMAIL_PASS
   - Check SMTP settings
   - Ensure app password is used for Gmail

3. **PDF Generation Failed**
   - Check REPORTS_DIR exists and is writable
   - Verify pdfkit dependency is installed

4. **Database Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI environment variable

### Debug Mode

To enable debug logging, set:
```env
NODE_ENV=development
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database and Redis URLs
3. Set up proper SSL certificates
4. Configure production email settings
5. Set up monitoring and alerting
6. Configure backup strategies

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include logging for new features
4. Update documentation
5. Test thoroughly before submitting
