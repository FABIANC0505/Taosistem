#!/usr/bin/env node
/**
 * Frontend Pre-Deployment Validation Script
 * Checks that frontend is ready for Vercel deployment
 */

import fs from 'fs';
import path from 'path';

const Colors = {
  OK: '\x1b[92m',
  ERROR: '\x1b[91m',
  WARN: '\x1b[93m',
  INFO: '\x1b[94m',
  END: '\x1b[0m',
};

function check(condition, message) {
  if (condition) {
    console.log(`${Colors.OK}✓${Colors.END} ${message}`);
    return true;
  } else {
    console.log(`${Colors.ERROR}✗${Colors.END} ${message}`);
    return false;
  }
}

function warn(message) {
  console.log(`${Colors.WARN}!${Colors.END} ${message}`);
}

function info(message) {
  console.log(`${Colors.INFO}ℹ${Colors.END} ${message}`);
}

console.log(`\n${Colors.INFO}═══════════════════════════════════════════${Colors.END}`);
console.log(`${Colors.INFO}Frontend Pre-Deployment Validation${Colors.END}`);
console.log(`${Colors.INFO}═══════════════════════════════════════════${Colors.END}\n`);

let passed = 0;
let failed = 0;

// 1. Check directory structure
console.log(`${Colors.INFO}Checking directory structure...${Colors.END}`);
const requiredDirs = [
  'src',
  'src/components',
  'src/pages',
  'src/services',
  'src/hooks',
  'src/types',
  'src/utils',
  'public',
];

for (const dir of requiredDirs) {
  if (check(fs.existsSync(dir), `Directory '${dir}' exists`)) {
    passed++;
  } else {
    failed++;
  }
}

// 2. Check critical files
console.log(`\n${Colors.INFO}Checking critical files...${Colors.END}`);
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
];

for (const file of requiredFiles) {
  if (check(fs.existsSync(file), `File '${file}' exists`)) {
    passed++;
  } else {
    failed++;
  }
}

// 3. Check package.json
console.log(`\n${Colors.INFO}Checking package.json...${Colors.END}`);
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = ['react', 'vite', 'typescript', 'axios', 'tailwindcss'];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  for (const dep of requiredDeps) {
    if (check(dep in allDeps, `Dependency '${dep}' is listed`)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Check for build and dev scripts
  const scripts = packageJson.scripts || {};
  if (check(scripts.build, "Build script exists")) {
    passed++;
  } else {
    failed++;
  }
  
  if (check(scripts.dev, "Dev script exists")) {
    passed++;
  } else {
    failed++;
  }
} catch (e) {
  console.log(`${Colors.ERROR}✗${Colors.END} Error reading package.json: ${e.message}`);
  failed += 5;
}

// 4. Check vite.config.ts
console.log(`\n${Colors.INFO}Checking Vite configuration...${Colors.END}`);
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  if (check(viteConfig.includes('react()'), "Vite React plugin configured")) {
    passed++;
  } else {
    failed++;
  }
  
  if (check(viteConfig.includes('defineConfig'), "defineConfig used")) {
    passed++;
  } else {
    failed++;
  }
} catch (e) {
  console.log(`${Colors.ERROR}✗${Colors.END} Error reading vite.config.ts: ${e.message}`);
  failed += 2;
}

// 5. Check API integration
console.log(`\n${Colors.INFO}Checking API integration...${Colors.END}`);
try {
  const apiUtils = fs.readFileSync('src/utils/api.ts', 'utf8');
  
  if (check(apiUtils.includes('VITE_API_URL'), "VITE_API_URL environment variable used")) {
    passed++;
  } else {
    failed++;
  }
  
  if (check(apiUtils.includes('axios'), "Axios client configured")) {
    passed++;
  } else {
    failed++;
  }
} catch (e) {
  console.log(`${Colors.ERROR}✗${Colors.END} Error reading src/utils/api.ts: ${e.message}`);
  failed += 2;
}

// 6. Check .env.production
console.log(`\n${Colors.INFO}Checking environment configuration...${Colors.END}`);
if (fs.existsSync('.env.production')) {
  const envProd = fs.readFileSync('.env.production', 'utf8');
  if (check(envProd.includes('VITE_API_URL'), ".env.production has VITE_API_URL")) {
    passed++;
  } else {
    failed++;
  }
  info(".env.production template found (set VITE_API_URL in Vercel dashboard)");
} else {
  warn(".env.production template not found");
  failed++;
}

// 7. Check .gitignore
console.log(`\n${Colors.INFO}Checking .gitignore...${Colors.END}`);
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  
  const gitChecks = [
    ['node_modules', 'node_modules in .gitignore'],
    ['dist/', 'dist in .gitignore'],
    ['.env', '.env in .gitignore'],
  ];
  
  for (const [pattern, desc] of gitChecks) {
    if (check(gitignore.includes(pattern), desc)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  check(true, ".gitignore exists");
  passed++;
} else {
  warn(".gitignore not found in root");
  failed++;
}

// Warnings
console.log(`\n${Colors.WARN}Deployment Warnings:${Colors.END}`);
if (fs.existsSync('.env')) {
  warn(".env file found — make sure NOT to commit it");
}
if (fs.existsSync('src/.env')) {
  warn("src/.env file found — remove it");
}

// Summary
console.log(`\n${Colors.INFO}═══════════════════════════════════════════${Colors.END}`);
console.log(`${Colors.INFO}Summary${Colors.END}`);
console.log(`${Colors.INFO}═══════════════════════════════════════════${Colors.END}`);
console.log(`${Colors.OK}Passed: ${passed}${Colors.END}`);
console.log(`${Colors.ERROR}Failed: ${failed}${Colors.END}`);

if (failed === 0) {
  console.log(`\n${Colors.OK}✓ Frontend is ready for deployment to Vercel!${Colors.END}\n`);
  process.exit(0);
} else {
  console.log(`\n${Colors.ERROR}✗ Fix the issues above before deploying${Colors.END}\n`);
  process.exit(1);
}
