#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const pkgPath = path.join(projectRoot, 'package.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const deps = Object.keys(pkg.dependencies || {});

function isInstalled(depName) {
  const depPath = path.join(projectRoot, 'node_modules', depName, 'package.json');
  return fs.existsSync(depPath);
}

const missing = deps.filter((dep) => !isInstalled(dep));

if (missing.length === 0) {
  process.exit(0);
}

console.log('📦 Brakujące zależności: ' + missing.join(', '));
console.log('🔧 Uruchamiam `npm install` automatycznie...');

const install = spawnSync('npm', ['install'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (install.status !== 0) {
  console.error('❌ `npm install` nie powiodło się. Uruchom ręcznie: npm install');
  process.exit(install.status || 1);
}

console.log('✅ Zależności zainstalowane.');
