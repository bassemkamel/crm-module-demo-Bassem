// JWT configuration is read from the environment (set via docker-compose / .env).
// A development fallback secret is used when unset so local runs work, but a
// real secret MUST be provided in production (see DECISIONS.md / .env.example).
export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me';

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';

/** Shape of the signed JWT payload. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** Authenticated user attached to the request by the JWT strategy. */
export interface AuthUser {
  userId: string;
  email: string;
}
