import { Client, Opportunity } from '@prisma/client';
import { ClientResponse, toClientResponse } from '../clients/client.mapper';
import {
  computeHealth,
  isProblematic,
  OpportunityHealth,
} from './opportunity.health';

export type OpportunityWithClient = Opportunity & { client: Client };

/**
 * API shape of an opportunity: `amount` is exposed as a number (Prisma returns a
 * Decimal), enriched with computed `health` / `isProblematic`, and the related
 * client is included with its `displayName`.
 */
export interface OpportunityResponse {
  id: string;
  title: string;
  amount: number;
  expectedCloseDate: Date;
  stage: Opportunity['stage'];
  stageChangedAt: Date;
  health: OpportunityHealth;
  isProblematic: boolean;
  clientId: string;
  client: ClientResponse;
  createdAt: Date;
  updatedAt: Date;
}

export function toOpportunityResponse(
  opportunity: OpportunityWithClient,
  now: Date = new Date(),
): OpportunityResponse {
  const health = computeHealth(opportunity, now);

  return {
    id: opportunity.id,
    title: opportunity.title,
    amount: Number(opportunity.amount),
    expectedCloseDate: opportunity.expectedCloseDate,
    stage: opportunity.stage,
    stageChangedAt: opportunity.stageChangedAt,
    health,
    isProblematic: isProblematic(health),
    clientId: opportunity.clientId,
    client: toClientResponse(opportunity.client),
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };
}
