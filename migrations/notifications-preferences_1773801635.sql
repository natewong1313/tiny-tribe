--- Altered Models
ALTER TABLE
  "User"
ADD
  COLUMN "notification_type" text DEFAULT '';

ALTER TABLE
  "User"
ADD
  COLUMN "phone_number" text DEFAULT '';