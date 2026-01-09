#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set
 * Usage: node scripts/validate-env.cjs
 */

const fs = require('fs');
const path = require('path');

// Required frontend environment variables
const REQUIRED_FRONTEND_VARS = [
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_API_BASE_URL',
  'VITE_BACKEND_URL',
  'VITE_STORAGE_KEY',
  'VITE_USER_STORAGE_KEY'
];

// Required backend environment variables
const REQUIRED_BACKEND_VARS = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function validateEnvironment() {
  console.log('🔍 Validating Single .env Configuration...\n');
  
  let hasErrors = false;
  
  // Load single .env file
  console.log('📄 Loading single .env file from project root:');
  const env = loadEnvFile('.env');
  
  if (Object.keys(env).length === 0) {
    console.log('  ❌ .env file not found or empty');
    hasErrors = true;
    return;
  } else {
    console.log(`  ✅ .env file loaded with ${Object.keys(env).length} variables\n`);
  }
  
  // Validate Frontend Environment Variables
  console.log('📱 Frontend Environment Variables:');
  REQUIRED_FRONTEND_VARS.forEach(varName => {
    if (env[varName]) {
      console.log(`  ✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      hasErrors = true;
    }
  });
  
  // Validate Backend Environment Variables
  console.log('\n🖥️  Backend Environment Variables:');
  REQUIRED_BACKEND_VARS.forEach(varName => {
    if (env[varName]) {
      // Hide sensitive values
      const displayValue = varName.includes('PASSWORD') || varName.includes('SECRET') 
        ? '***HIDDEN***' 
        : env[varName];
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      hasErrors = true;
    }
  });
  
  // Check for example files
  console.log('\n📋 Example Files:');
  const exampleFiles = ['.env.example'];
  exampleFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}: EXISTS`);
    } else {
      console.log(`  ❌ ${file}: MISSING`);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Please check the missing variables and update your .env file');
    process.exit(1);
  } else {
    console.log('✅ Environment validation PASSED');
    console.log('All required environment variables are configured in single .env file');
  }
}

// Run validation
validateEnvironment();