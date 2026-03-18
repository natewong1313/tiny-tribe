--- New Models
CREATE TABLE IF NOT EXISTS "Friendship" (
  "id" text PRIMARY KEY,
  "requesterId" text NOT NULL,
  "addresseeId" text NOT NULL,
  "status" text NOT NULL,
  "responded_at" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  UNIQUE ("requesterId", "addresseeId"),
  FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);