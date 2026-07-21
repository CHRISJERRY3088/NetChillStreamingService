const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('ensureMoviesApiReady rejects quickly when the API never becomes available', async () => {
  const source = fs.readFileSync(path.join(__dirname, 'movies.js'), 'utf8');
  const sandbox = {
    window: {},
    document: {
      addEventListener: () => {},
      querySelector: () => null,
      getElementById: () => null,
    },
    console,
    setTimeout,
    clearTimeout,
    Date,
  };

  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  const result = await Promise.race([
    sandbox.ensureMoviesApiReady().then(() => 'resolved').catch((error) => error.message),
    new Promise((resolve) => setTimeout(() => resolve('timeout'), 200)),
  ]);

  assert.equal(result, 'Movies API did not become available in time.');
});
