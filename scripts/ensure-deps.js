#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const pkgPath = path.join(projectRoot, 'package.json');
const ignoredDirs = new Set(['.git', 'node_modules', 'uploads']);
const conflictPattern = /^(<<<<<<< |=======|>>>>>>> )/m;

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const deps = Object.keys(pkg.dependencies || {});

function listFilesRecursive(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(fullPath));
      continue;
    }
    out.push(fullPath);
  }

  return out;
}

function detectMergeConflicts() {
  const files = listFilesRecursive(projectRoot);
  const conflicted = [];

  for (const filePath of files) {
    if (!/\.(md|js|json|ts|tsx|jsx|yml|yaml|env|txt)$/i.test(filePath)) continue;
    const text = fs.readFileSync(filePath, 'utf8');
    if (conflictPattern.test(text)) {
      conflicted.push(path.relative(projectRoot, filePath));
    }
  }

  return conflicted;
}

function isInstalled(depName) {
  const depPath = path.join(projectRoot, 'node_modules', depName, 'package.json');
  return fs.existsSync(depPath);
}

const missing = deps.filter((dep) => !isInstalled(dep));
const conflicts = detectMergeConflicts();

if (conflicts.length > 0) {
  console.error('❌ Wykryto nierozwiązane konflikty merge. Usuń znaczniki:');
  for (const file of conflicts) {
    console.error('   - ' + file);
  }
  console.error('Szukaj linii zaczynających się od: <<<<<<<, =======, >>>>>>>');
  process.exit(1);
}

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
