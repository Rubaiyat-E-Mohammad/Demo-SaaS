import { test, expect } from '@playwright/test';
import { SignInApi } from '../clients/signInApi.ts';
import { Credentials } from '../utils/testData.ts';

test.describe('Sign-in API — Authentication & Validation', () => {

  /**
   * @Test_Scenarios : [SIGN-IN API]
   * @Test_AS0005 : Missing email field returns 400 with zod details
   * @Test_AS0006 : Missing password field returns 400 with zod details
   * @Test_AS0007 : Empty JSON body returns 400 with zod details
   * @Test_AS0004 : Malformed email returns 400 INVALID_EMAIL
   * @Test_AS0001 : Valid credentials return 200 with user object
   * @Test_AS0002 : Wrong password returns 401 INVALID_EMAIL_OR_PASSWORD
   * @Test_AS0003 : Unregistered email returns 401 INVALID_EMAIL_OR_PASSWORD
   *
   * Each test fires a real POST against the shared Demo SaaS backend, which
   * rate-limits bursts per IP — every request counts (validation 400s feed
   * the bucket just like auth 200/401). Empirically the limit is ~4 reqs in
   * any 30s window: 5s → 429 on 4th, 8s → 429 on 4th, 10s → all pass, 12s →
   * all pass. 10s leaves a small safety margin above the floor and cuts
   * total runtime ~40% vs the previous 15s gate.
   */

  const COOLDOWN_MS = 10_000;
  let testCount = 0;
  test.beforeEach(async () => {
    if (testCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, COOLDOWN_MS));
    }
    testCount += 1;
  });

  test('AS0005 : Missing email field returns 400 with zod details', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithBody({ password: Credentials.arbitraryPassword });
    await api.assertStatus(res, 400);
    const body = await api.parseJson<{ details: Array<{ path: string[]; code: string }> }>(res);
    expect(body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['email'] })]),
    );
  });

  test('AS0006 : Missing password field returns 400 with zod details', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithBody({ email: Credentials.valid.email });
    await api.assertStatus(res, 400);
    const body = await api.parseJson<{ details: Array<{ path: string[]; code: string }> }>(res);
    expect(body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['password'] })]),
    );
  });

  test('AS0007 : Empty JSON body returns 400 with zod details', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithBody({});
    await api.assertStatus(res, 400);
    const body = await api.parseJson<{ details: Array<{ path: string[] }> }>(res);
    const paths = body.details.map((d) => d.path[0]);
    expect(paths).toContain('email');
    expect(paths).toContain('password');
  });

  test('AS0004 : Malformed email returns 400 INVALID_EMAIL', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithEmail(Credentials.invalidFormatEmail, Credentials.arbitraryPassword);
    await api.assertStatus(res, 400);
    await api.assertJsonField(res, 'code', 'INVALID_EMAIL');
  });

  test('AS0001 : Valid credentials return 200 with user object', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithEmail(Credentials.valid.email, Credentials.valid.password);
    await api.assertStatus(res, 200);
    const body = await api.parseJson<{ user: { email: string; emailVerified: boolean } }>(res);
    expect(body.user.email).toBe(Credentials.valid.email);
    expect(body.user.emailVerified).toBe(true);
  });

  test('AS0002 : Wrong password returns 401 INVALID_EMAIL_OR_PASSWORD', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithEmail(Credentials.valid.email, Credentials.wrongPassword);
    await api.assertStatus(res, 401);
    await api.assertJsonField(res, 'code', 'INVALID_EMAIL_OR_PASSWORD');
  });

  test('AS0003 : Unregistered email returns 401 INVALID_EMAIL_OR_PASSWORD', async ({ request }) => {
    const api = new SignInApi(request);
    const res = await api.signInWithEmail(Credentials.unregisteredEmail, Credentials.arbitraryPassword);
    await api.assertStatus(res, 401);
    await api.assertJsonField(res, 'code', 'INVALID_EMAIL_OR_PASSWORD');
  });
});
