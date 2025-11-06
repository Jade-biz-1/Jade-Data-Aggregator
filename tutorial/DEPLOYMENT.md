# Deployment Guide - Data Aggregator Tutorial

This guide covers deploying the tutorial application to production.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Prerequisites
- Vercel account
- Git repository with your code
- Data Aggregator Platform API accessible

#### Steps

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd tutorial
vercel
```

4. **Configure Environment Variables**

In Vercel dashboard, add:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://tutorial.yourdomain.com
```

5. **Deploy to Production**
```bash
vercel --prod
```

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_APP_URL": "@app-url"
  }
}
```

### Option 2: Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4000

ENV PORT 4000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Build and Run

```bash
# Build image
docker build -t tutorial-app .

# Run container
docker run -p 4000:4000 \
  -e NEXT_PUBLIC_API_URL=http://api:8001 \
  -e NEXT_PUBLIC_APP_URL=http://localhost:4000 \
  tutorial-app
```

#### Docker Compose

```yaml
version: '3.8'

services:
  tutorial:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8001
      - NEXT_PUBLIC_APP_URL=http://localhost:4000
    depends_on:
      - api
    restart: unless-stopped

  api:
    image: data-aggregator-platform:latest
    ports:
      - "8001:8001"
    restart: unless-stopped
```

### Option 3: Self-Hosted (Node.js)

#### Prerequisites
- Node.js 18+ installed
- Process manager (PM2 recommended)

#### Steps

1. **Build Application**
```bash
npm run build
```

2. **Install PM2**
```bash
npm install -g pm2
```

3. **Create PM2 Ecosystem File** (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'tutorial',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/tutorial',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      NEXT_PUBLIC_API_URL: 'https://api.yourdomain.com',
      NEXT_PUBLIC_APP_URL: 'https://tutorial.yourdomain.com'
    },
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

4. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d tutorial.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name tutorial.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tutorial.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/tutorial.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tutorial.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring

### Option 1: Vercel Analytics

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Option 2: Google Analytics

```typescript
// lib/analytics.ts
export const GA_TRACKING_ID = 'G-XXXXXXXXXX';

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};
```

### Option 3: Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## 🧪 Pre-Deployment Checklist

- [ ] Run production build locally (`npm run build && npm start`)
- [ ] Test all module pages load correctly
- [ ] Verify API integration works
- [ ] Test TransformationEditor functionality
- [ ] Test PipelineCanvas functionality
- [ ] Check responsive design on mobile/tablet
- [ ] Verify progress tracking saves correctly
- [ ] Test all navigation links
- [ ] Check browser console for errors
- [ ] Run accessibility audit
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify environment variables are set
- [ ] Review security headers
- [ ] Enable HTTPS/SSL
- [ ] Configure monitoring and error tracking
- [ ] Set up backup strategy
- [ ] Document deployment process

## 📈 Performance Optimization

### Next.js Optimizations

1. **Enable Image Optimization**
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

2. **Enable Compression**
```typescript
// next.config.js
module.exports = {
  compress: true,
}
```

3. **Analyze Bundle Size**
```bash
npm install @next/bundle-analyzer
```

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})
```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **API Keys**: Use server-side environment variables when possible
3. **CORS**: Configure proper CORS headers on API
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Content Security Policy**: Add CSP headers
6. **HTTPS Only**: Enforce HTTPS in production
7. **Regular Updates**: Keep dependencies up to date

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Tutorial

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Post-Deployment

1. **Test Production URL**: Visit all pages
2. **Monitor Errors**: Check Sentry/monitoring tools
3. **Check Analytics**: Verify tracking is working
4. **User Testing**: Have users test the tutorial
5. **Gather Feedback**: Set up feedback mechanism
6. **Document Issues**: Track any bugs or improvements
7. **Plan Updates**: Schedule regular updates and maintenance

## 🆘 Troubleshooting

### Common Issues

**Issue**: Build fails with memory error
**Solution**: Increase Node memory
```bash
NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

**Issue**: API connection fails
**Solution**: Check CORS settings and environment variables

**Issue**: Static files not loading
**Solution**: Check `next.config.js` and `public/` directory

**Issue**: Module not found errors
**Solution**: Run `npm ci` to clean install dependencies

## 📞 Support

For deployment issues:
1. Check build logs
2. Verify environment variables
3. Test locally with production build
4. Review Vercel/platform documentation
5. Check API connectivity

---

**Deployment completed!** 🎉

Access your tutorial at your configured URL and verify all functionality works correctly.
