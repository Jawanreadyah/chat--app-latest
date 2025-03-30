/*
  # Add Friend Request System

  1. New Tables
    - `friend_codes`
      - `code` (text, primary key) - 5 character unique code
      - `chat_id` (text) - reference to chats table
      - `created_at` (timestamp) - when the code was created
      - `expires_at` (timestamp) - when the code expires (24 hours after creation)

  2. Security
    - Enable RLS on `friend_codes` table
    - Add policies for public access
    - Add cleanup function for expired codes

  3. Indexes
    - Index on chat_id for faster lookups
    - Index on expires_at for cleanup performance
*/

-- Create the friend_codes table
DO $$ BEGIN
  CREATE TABLE friend_codes (
    code text PRIMARY KEY,
    chat_id text REFERENCES chats(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '24 hours')
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX friend_codes_chat_id_idx ON friend_codes(chat_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX friend_codes_expires_at_idx ON friend_codes(expires_at);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE friend_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read friend codes" ON friend_codes;
  DROP POLICY IF EXISTS "Anyone can insert friend codes" ON friend_codes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Anyone can read friend codes"
ON friend_codes
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can insert friend codes"
ON friend_codes
FOR INSERT
TO public
WITH CHECK (true);

-- Create or replace the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_friend_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM friend_codes WHERE expires_at < now();
END;
$$;