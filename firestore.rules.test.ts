/**
 * Security Rules TDD Specification for ProjectorGuide India
 * Verifies the "Dirty Dozen" adversarial payloads against firestore.rules.
 * Run with Firebase Emulator Suite when testing locally.
 */
export interface SecurityTestCase {
  id: string;
  description: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 'DD-01',
    description: 'Reject unauthenticated profile read',
    operation: 'get',
    path: '/users/user_alice',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    description: 'Reject cross-user PII read',
    operation: 'get',
    path: '/users/user_alice',
    auth: { uid: 'user_bob', email: 'bob@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    description: 'Reject unverified email profile creation',
    operation: 'create',
    path: '/users/user_alice',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    description: 'Reject shadow ghost field injection (isAdmin)',
    operation: 'create',
    path: '/users/user_alice',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      uid: 'user_alice',
      displayName: 'Alice',
      email: 'alice@example.com',
      preferredLanguage: 'en',
      preferredUnit: 'ft',
      newsletterSubscribed: false,
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    description: 'Reject malformed path ID poisoning',
    operation: 'create',
    path: '/users/user_alice/configurations/bad$id..hack',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    description: 'Reject identity spoofing in subcollection payload',
    operation: 'create',
    path: '/users/user_alice/priceWatches/watch_01',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      id: 'watch_01',
      userId: 'user_bob',
      modelId: 'benq-tk700sti',
      targetPriceInr: 120000,
      alertEnabled: true,
      notes: '',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    description: 'Reject client-forged timestamp on creation',
    operation: 'create',
    path: '/users/user_alice/priceWatches/watch_01',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      id: 'watch_01',
      userId: 'user_alice',
      modelId: 'benq-tk700sti',
      targetPriceInr: 120000,
      alertEnabled: true,
      notes: '',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    description: 'Reject immutable userId modification on update',
    operation: 'update',
    path: '/users/user_alice/configurations/cfg_01',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { userId: 'user_bob' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    description: 'Reject negative price value poisoning on update',
    operation: 'update',
    path: '/users/user_alice/priceWatches/watch_01',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { targetPriceInr: -5000 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    description: 'Reject invalid enum injection on configuration',
    operation: 'create',
    path: '/users/user_alice/configurations/cfg_02',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { indiaPower: 'unrecognized_power_mode' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    description: 'Reject oversized string payload (Denial of Wallet)',
    operation: 'create',
    path: '/users/user_alice/configurations/cfg_03',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { notes: 'x'.repeat(2500) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    description: 'Reject blanket list query on /users collection',
    operation: 'list',
    path: '/users',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
