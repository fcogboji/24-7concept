#!/usr/bin/env node
/**
 * Production Readiness Check
 * Run before deploying to production: node scripts/check-production-readiness.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

let hasErrors = false;
let hasWarnings = false;

function error(msg) {
  console.error(`❌ ERROR: ${msg}`);
  hasErrors = true;
}

function warn(msg) {
  console.warn(`⚠️  WARNING: ${msg}`);
  hasWarnings = true;
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

console.log('\n🔍 Running Production Readiness Checks...\n');

// 1. Check environment variables
console.log('📋 Checking required environment variables...');

const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SECRET_ENCRYPTION_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
];

for (const key of required) {
  if (process.env[key]) {
    success(`${key} is set`);
  } else {
    error(`${key} is missing`);
  }
}

// 2. Check production keys
console.log('\n🔑 Checking for test keys in production...');

if (process.env.NODE_ENV === 'production') {
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    error('Using Stripe TEST key in production');
  } else if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    success('Stripe LIVE key configured');
  }

  if (process.env.CLERK_SECRET_KEY?.includes('_test_')) {
    error('Using Clerk TEST key in production');
  } else {
    success('Clerk production key configured');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
    error('NEXT_PUBLIC_APP_URL must use HTTPS in production');
  } else {
    success('App URL uses HTTPS');
  }
}

// 3. Check Upstash
console.log('\n🚀 Checking rate limiting configuration...');

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  success('Upstash Redis configured for distributed rate limiting');
} else {
  if (process.env.NODE_ENV === 'production') {
    error('Upstash Redis is REQUIRED in production for rate limiting');
  } else {
    warn('Upstash Redis not configured (OK for development)');
  }
}

// 4. Check dependencies
console.log('\n📦 Checking for known vulnerabilities...');

try {
  const { execSync } = require('child_process');
  execSync('npm audit --production --audit-level=high', { stdio: 'inherit' });
  success('No high-severity vulnerabilities in production dependencies');
} catch (e) {
  error('npm audit found vulnerabilities. Run: npm audit fix');
}

// 5. Check package.json scripts
console.log('\n🔧 Checking build configuration...');

if (packageJson.scripts.build) {
  success('Build script configured');
} else {
  error('Missing build script in package.json');
}

if (packageJson.scripts.start) {
  success('Start script configured');
} else {
  error('Missing start script in package.json');
}

// 6. Check Prisma
console.log('\n🗄️  Checking database configuration...');

if (packageJson.dependencies['@prisma/client']) {
  success('Prisma Client installed');
} else {
  error('Prisma Client missing from dependencies');
}

// 7. Summary
console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.error('\n❌ FAILED: Fix the errors above before deploying to production!\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  PASSED WITH WARNINGS: Review warnings before deploying.\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED: Ready for production deployment!\n');
  process.exit(0);
}
