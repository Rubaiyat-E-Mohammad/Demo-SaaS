import { test, expect } from '@playwright/test';
import { TicketsApi } from '../clients/ticketsApi.ts';

/**
 * @Test_Scenarios : [TICKETS API — tRPC tickets.create]
 * @Test_AT0001 : Valid payload returns the new ticket with status "New"
 * @Test_AT0002 : Missing all required fields returns 400 with zod fieldErrors
 * @Test_AT0003 : Invalid email in reportedBy returns 400 with zod fieldErrors
 * @Test_AT0004 : Empty inner JSON returns 400 with zod formErrors "Required"
 * @Test_AT0005 : Missing x-organization header returns 403 FORBIDDEN
 * @Test_AT0006 : Unknown organization slug returns 403 FORBIDDEN
 *
 * The endpoint is anonymous (no auth cookie) but scoped by the
 * `x-organization` header. We use the known seeded org `qa-exploration-org`
 * for happy-path and validation cases. Negative-org tests use a slug that
 * does not exist to verify the server rejects rather than leaking.
 */

const ORG_SLUG = 'qa-exploration-org';

test.describe('Tickets API — tickets.create (anonymous public submit)', () => {
  test('AT0001 : Valid payload returns the new ticket with status "New"', async ({ request }) => {
    const api = new TicketsApi(request);
    const stamp = Date.now();
    const res = await api.createTicket(
      {
        title: `AT0001 happy path ${stamp}`,
        body: 'Created by Playwright api/tests/tickets.spec.ts',
        reportedBy: 'qa-bot@example.com',
        authorName: 'QA Bot',
      },
      ORG_SLUG,
    );
    await api.assertStatus(res, 200);
    const body = await api.parseJson<
      Array<{ result: { data: { json: { id: string; title: string; status: string; organizationId: string } } } }>
    >(res);
    expect(body[0]?.result?.data?.json?.status).toBe('New');
    expect(body[0]?.result?.data?.json?.title).toBe(`AT0001 happy path ${stamp}`);
    expect(body[0]?.result?.data?.json?.id).toMatch(/^[a-z0-9]+$/);
  });

  test('AT0002 : Missing all required fields returns 400 with zod fieldErrors', async ({ request }) => {
    const api = new TicketsApi(request);
    const res = await api.createTicketWithBody({}, ORG_SLUG);
    await api.assertStatus(res, 400);
    const body = await api.parseJson<
      Array<{ error: { json: { data: { code: string; zodError: { fieldErrors: Record<string, string[]> } } } } }>
    >(res);
    expect(body[0]?.error?.json?.data?.code).toBe('BAD_REQUEST');
    const fieldErrors = body[0]?.error?.json?.data?.zodError?.fieldErrors ?? {};
    expect(Object.keys(fieldErrors)).toEqual(
      expect.arrayContaining(['title', 'body', 'reportedBy', 'authorName']),
    );
  });

  test('AT0003 : Invalid email in reportedBy returns 400 with zod fieldErrors', async ({ request }) => {
    const api = new TicketsApi(request);
    const res = await api.createTicketWithBody(
      { title: 'AT0003', body: 'x', reportedBy: 'notanemail', authorName: 'QA' },
      ORG_SLUG,
    );
    await api.assertStatus(res, 400);
    const body = await api.parseJson<
      Array<{ error: { json: { data: { zodError: { fieldErrors: Record<string, string[]> } } } } }>
    >(res);
    expect(body[0]?.error?.json?.data?.zodError?.fieldErrors?.reportedBy).toEqual(
      expect.arrayContaining(['Invalid email']),
    );
  });

  test('AT0004 : Empty inner JSON returns 400 with zod formErrors "Required"', async ({ request }) => {
    const api = new TicketsApi(request);
    // Inner json is missing entirely — sentinel for the tRPC envelope itself.
    const res = await api.postJson(
      api.ticketsCreateEndpoint,
      {},
      { 'x-organization': ORG_SLUG },
    );
    await api.assertStatus(res, 400);
    const body = await api.parseJson<
      Array<{ error: { json: { data: { code: string; zodError: { formErrors: string[] } } } } }>
    >(res);
    expect(body[0]?.error?.json?.data?.code).toBe('BAD_REQUEST');
    expect(body[0]?.error?.json?.data?.zodError?.formErrors).toEqual(['Required']);
  });

  test('AT0005 : Missing x-organization header returns 403 FORBIDDEN', async ({ request }) => {
    const api = new TicketsApi(request);
    const res = await api.createTicketWithoutOrgHeader({
      title: 'AT0005', body: 'x', reportedBy: 'qa-bot@example.com', authorName: 'QA',
    });
    await api.assertStatus(res, 403);
    const body = await api.parseJson<Array<{ error: { json: { data: { code: string; httpStatus: number } } } }>>(res);
    expect(body[0]?.error?.json?.data?.code).toBe('FORBIDDEN');
    expect(body[0]?.error?.json?.data?.httpStatus).toBe(403);
  });

  test('AT0006 : Unknown organization slug returns 403 FORBIDDEN', async ({ request }) => {
    const api = new TicketsApi(request);
    const res = await api.createTicket(
      { title: 'AT0006', body: 'x', reportedBy: 'qa-bot@example.com', authorName: 'QA' },
      'nonexistent-org-9921',
    );
    await api.assertStatus(res, 403);
    const body = await api.parseJson<Array<{ error: { json: { data: { code: string } } } }>>(res);
    expect(body[0]?.error?.json?.data?.code).toBe('FORBIDDEN');
  });
});
