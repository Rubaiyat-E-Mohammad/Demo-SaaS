import type { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiHelpers } from '../utils/apiHelpers.ts';

/**
 * tRPC ticket-creation API client (`tickets.create`).
 *
 * This endpoint is the **anonymous** customer-ticket-submit surface — it does
 * NOT require authentication, but does require the `x-organization` header
 * to scope the new ticket to a known organization. Without the header the
 * server returns 403 FORBIDDEN; with an unknown slug it also returns 403.
 *
 * tRPC encodes the body as `{"0":{"json": <payload>}}` and the response as
 * `[{"result":{"data":{"json": <obj>}}}]` (success) or
 * `[{"error":{"json":{"data":{"httpStatus":..., "code":...,"zodError":...}}}}]`
 * (failure).
 */
export class TicketsApi extends ApiHelpers {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Submit a ticket via tRPC. `payload` is the inner JSON; we wrap it in the
   * tRPC `{"0":{"json": ...}}` envelope.
   */
  async createTicket(
    payload: { title: string; body: string; reportedBy: string; authorName: string },
    organizationSlug: string,
  ): Promise<APIResponse> {
    return this.postJson(
      this.ticketsCreateEndpoint,
      { 0: { json: payload } },
      { 'x-organization': organizationSlug },
    );
  }

  /** Same as `createTicket`, but with an arbitrary inner payload — for negative cases. */
  async createTicketWithBody(innerJson: unknown, organizationSlug: string): Promise<APIResponse> {
    return this.postJson(
      this.ticketsCreateEndpoint,
      { 0: { json: innerJson } },
      { 'x-organization': organizationSlug },
    );
  }

  /** Call the endpoint without the `x-organization` header to probe auth/scoping. */
  async createTicketWithoutOrgHeader(payload: {
    title: string; body: string; reportedBy: string; authorName: string;
  }): Promise<APIResponse> {
    return this.postJson(this.ticketsCreateEndpoint, { 0: { json: payload } });
  }
}
