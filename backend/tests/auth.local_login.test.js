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

test('login allows the same device to sign in again until logout', async () => {
  const email = 'device-same-test@example.com';
  addUser({
    id: 'device-same-test-user',
    fullName: 'Device Same Test User',
    email,
    password: 'device-pass',
    subscription: 'Free',
    activeDeviceId: 'phone-1',
  });

  const req = {
    body: { email, password: 'device-pass' },
    headers: { 'x-device-id': 'phone-1' },
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, email);
});

test('login allows sign-in from a different device', async () => {
  const email = 'device-different-test@example.com';
  addUser({
    id: 'device-different-test-user',
    fullName: 'Device Different Test User',
    email,
    password: 'device-pass',
    subscription: 'Free',
    activeDeviceId: 'phone-1',
  });

  const req = {
    body: { email, password: 'device-pass' },
    headers: { 'x-device-id': 'phone-2' },
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, email);
});
