/*
  # Add last_seen column to user_statuses

  1. Changes
    - Add last_seen column to user_statuses table to track when users were last online
    - This helps with showing "last seen" information for offline users
*/

-- Add last_seen column to user_statuses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_statuses' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE user_statuses ADD COLUMN last_seen timestamptz;
  END IF;
END $$;

-- Create index for better performance on last_seen queries
CREATE INDEX IF NOT EXISTS user_statuses_last_seen_idx ON user_statuses(last_seen);

-- Update existing records to set last_seen to last_updated for offline users
UPDATE user_statuses 
SET last_seen = last_updated 
WHERE status = 'offline' AND last_seen IS NULL;