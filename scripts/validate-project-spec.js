#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findSpec() {
  const candidates = [
    path.join(process.cwd(), 'opencode.json'),
    path.join(process.cwd(), '.opencode', 'project.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function main() {
  const specPath = findSpec();
  if (!specPath) {
    fail('No project spec found (looked for opencode.json or .opencode/project.json).');
    return;
  }
  ok(`Found spec: ${path.relative(process.cwd(), specPath)}`);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    fail(`Failed to parse JSON: ${e.message}`);
    return;
  }

  // Minimal checks aligned with upstream intent.
  const errors = [];
  function reqStr(key) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      errors.push(`Missing or invalid string: ${key}`);
    }
  }
  function optArrayStr(key) {
    if (data[key] != null) {
      if (!Array.isArray(data[key]) || !data[key].every((x) => typeof x === 'string')) {
        errors.push(`Expected ${key} to be an array of strings`);
      }
    }
  }

  reqStr('name');
  reqStr('license');
  if (data.license && data.license !== 'GPL-3.0-only') {
    errors.push(`license must be "GPL-3.0-only" (got ${data.license})`);
  }
  // Common project fields
  reqStr('version');
  optArrayStr('packages');
  optArrayStr('workspace');

  if (errors.length) {
    console.error('
Project spec validation failed:');
    for (const e of errors) console.error(' - ' + e);
    process.exit(1);
  } else {
    ok('Project spec looks valid.');
  }
}

main();
