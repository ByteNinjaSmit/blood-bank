# Blood Bank Management System - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (for local development)
- Redis (for local development)

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/blood-bank

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Admin Email for Reports
ADMIN_EMAIL=admin@bloodbank.com

# Blood Bank Configuration
NEAR_EXPIRY_DAYS=5
REPORTS_DIR=./reports

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-change-this-in-production
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone the repository and navigate to server directory:**

   ```bash
   cd server
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Start all services:**

   ```bash
   docker-compose up -d
   ```

4. **Check service status:**

   ```bash
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   docker-compose logs -f blood-bank-api
   ```

### Manual Docker Build

1. **Build the image:**

   ```bash
   docker build -t blood-bank-api .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name blood-bank-api \
     -p 5000:5000 \
     --env-file .env \
     blood-bank-api
   ```

## 🔧 Local Development

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run prod
```

### Cluster Mode (Production)

```bash
npm run prod:cluster
```

## 📊 Health Checks

### API Health Check

```bash
curl http://localhost:5000/health
```

### Docker Health Check

```bash
docker-compose exec blood-bank-api npm run health
```

## 🔒 Security Configuration

### JWT Secrets

- Generate strong random strings for JWT_SECRET and JWT_REFRESH_SECRET
- Use at least 32 characters
- Example: `openssl rand -base64 32`

### Email Security

- Use Gmail App Passwords instead of regular passwords
- Enable 2FA on your Gmail account
- Generate app-specific password

### Database Security

- Use strong passwords for MongoDB
- Enable authentication
- Use SSL/TLS connections in production

## 📈 Monitoring and Logging

### Log Files

- Application logs: `./logs/app.log`
- Error logs: `./logs/error.log`
- Info logs: `./logs/info.log`

### Health Monitoring

- Health endpoint: `GET /health`
- Returns service status and uptime
- Monitor database, Redis, email, and PDF services

## 🔄 Backup and Recovery

### Database Backup

```bash
# MongoDB backup
docker-compose exec mongo mongodump --out /backup

# Redis backup (automatic with AOF)
docker-compose exec redis redis-cli BGSAVE
```

### File Backup

- Reports directory: `./reports`
- Uploads directory: `./uploads`
- Logs directory: `./logs`

## 🚨 Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Check if tslib is properly installed
   - Verify PDFKit dependencies
   - Check file permissions for reports directory

2. **Email Service Fails**
   - Verify email credentials in .env
   - Check Gmail app password
   - Ensure SMTP settings are correct

3. **Redis Connection Fails**
   - Verify REDIS_URL in .env
   - Check Redis service status
   - Ensure Redis is accessible

4. **Database Connection Fails**
   - Verify MONGODB_URI in .env
   - Check MongoDB service status
   - Ensure database is accessible

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 📋 Production Checklist

- [ ] Environment variables configured
- [ ] JWT secrets changed from defaults
- [ ] Email service configured
- [ ] Database connection established
- [ ] Redis connection established
- [ ] Health checks passing
- [ ] Logs being written
- [ ] File uploads working
- [ ] PDF generation working
- [ ] Email sending working
- [ ] Rate limiting configured
- [ ] CORS settings configured
- [ ] SSL/TLS configured (if using HTTPS)
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error handling tested

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild Docker image
docker-compose build blood-bank-api

# Restart services
docker-compose up -d
```

### Database Migrations

- MongoDB schema changes are handled automatically
- No manual migration scripts required

### Log Rotation

- Logs are automatically rotated
- Old logs are compressed and archived
- Monitor disk space usage

## 📞 Support

For issues and support:

1. Check the logs: `docker-compose logs blood-bank-api`
2. Verify health status: `curl http://localhost:5000/health`
3. Check environment variables
4. Review this documentation

## 🎯 Performance Optimization

### Production Settings

- Use cluster mode for multiple CPU cores
- Configure Redis for caching
- Optimize database queries
- Use CDN for static files
- Enable compression
- Configure proper timeouts

### Monitoring

- Monitor CPU and memory usage
- Track response times
- Monitor error rates
- Check queue performance
- Monitor disk space
