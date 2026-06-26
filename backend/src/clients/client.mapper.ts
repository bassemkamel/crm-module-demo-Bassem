import { Client, ClientType } from '@prisma/client';

/** A client enriched with a UI-friendly `displayName`. */
export type ClientResponse = Client & { displayName: string };

/**
 * Builds a human-readable name: the company name for companies, or the full
 * name for individuals. Falls back gracefully if the expected fields are empty.
 */
export function computeDisplayName(client: Client): string {
  if (client.type === ClientType.COMPANY) {
    return client.companyName?.trim() || 'Unnamed company';
  }

  const fullName = [client.firstName, client.lastName]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();

  return fullName || 'Unnamed individual';
}

export function toClientResponse(client: Client): ClientResponse {
  return { ...client, displayName: computeDisplayName(client) };
}
