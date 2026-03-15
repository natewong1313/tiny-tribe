--- New Models
CREATE TABLE IF NOT EXISTS "Post" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL,
  "text_content" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostMedia" (
  "id" text PRIMARY KEY,
  "postId" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);