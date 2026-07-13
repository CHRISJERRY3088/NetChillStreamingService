import { addUser } from '../lib/local_user_store.js';

const user = {
  id: `local-${Date.now()}`,
  fullName: 'Automated Test User',
  email: 'realtest@example.com',
  password: 'test123',
  subscription: 'Free',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

addUser(user);
console.log('Created test user:', user.email, 'password:', user.password);
