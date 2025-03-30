/*
  # Fix messages table policies

  1. Changes
    - Safely recreate RLS policies for messages table
    - Avoid duplicate constraint errors
    - Ensure proper policy setup for read/write access

  2. Security
    - Enable RLS on messages table
    - Add policies for public read/write access
*/

-- Enable RLS if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies safely
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
  EXCEPTION 
    WHEN undefined_object THEN 
      NULL;
  END;

  BEGIN
    DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;
  EXCEPTION 
    WHEN undefined_object THEN 
      NULL;
  END;

  -- Create new policies only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Anyone can read messages'
  ) THEN
    CREATE POLICY "Anyone can read messages"
      ON messages
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Anyone can insert messages'
  ) THEN
    CREATE POLICY "Anyone can insert messages"
      ON messages
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;