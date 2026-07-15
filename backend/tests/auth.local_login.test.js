import test from 'node:test';
import assert from 'node:assert/strict';
import { login } from '../controllers/auth.controllers.js';
import { addUser } from '../lib/local_user_store.js';
import { supabase } from '../lib/supabaseClient.js';

function createRes() {
  const res = {
    cookies: {},
    cookie(name, value, options) {
      this.cookies[name] = { value, options };
    },
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

test('login falls back to local user store when Supabase auth rejects credentials', async () => {
  const originalSignIn = supabase.auth.signInWithPassword;
  supabase.auth.signInWithPassword = async () => ({ data: null, error: { message: 'Invalid login credentials' } });

  const email = 'node-test@example.com';
  addUser({
    id: 'node-test-user',
    fullName: 'Node Test User',
    email,
    password: 'node-pass',
    subscription: 'Free',
  });

  const req = {
    body: { email, password: 'node-pass' },
  };
  const res = createRes();

  try {
    await login(req, res);
  } finally {
    supabase.auth.signInWithPassword = originalSignIn;
  }

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.user.fullName, 'Node Test User');
});

test('login sets non-secure cookies for local HTTP development', async () => {
  const email = 'cookie-test@example.com';
  addUser({
    id: 'cookie-test-user',
    fullName: 'Cookie Test User',
    email,
    password: 'cookie-pass',
    subscription: 'Free',
  });

  const req = {
    body: { email, password: 'cookie-pass' },
    headers: {},
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.cookies.jwt.options.secure, false);
});

test('login blocks repeated sign-ins within 24 hours for the same user', async () => {
  const email = 'cooldown-test@example.com';
  addUser({
    id: 'cooldown-test-user',
    fullName: 'Cooldown Test User',
    email,
    password: 'cooldown-pass',
    subscription: 'Free',
    lastLoginAt: new Date().toISOString(),
  });

  const req = {
    body: { email, password: 'cooldown-pass' },
    headers: {},
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 429);
  assert.match(res.body.message, /24 hours/i);
});
