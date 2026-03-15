--- New Models
CREATE TABLE IF NOT EXISTS "BetterAuthAccount" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" text,
  "refresh_token_expires_at" text,
  "scope" text,
  "password" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "BetterAuthSession" (
  "id" text PRIMARY KEY,
  "expires_at" text NOT NULL,
  "token" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "BetterAuthUser" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" integer NOT NULL,
  "image" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "BetterAuthVerification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" integer NOT NULL,
  "image" text,
  "username" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

--- Cloesce Temporary Table
CREATE TABLE IF NOT EXISTS "_cloesce_tmp" ("path" text PRIMARY KEY, "id" integer NOT NULL);