/*
  # Create messages table and policies

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (text, not null)
      - `user_info` (jsonb, not null)
      - `content` (text, not null)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on chat_id for faster lookups
    - Index on created_at for chronological queries

  3. Security
    - Enable RLS
    - Add policies for read and insert access
*/

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  user_info jsonb NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
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
END $$;

-- Create policies
DO $$ 
BEGIN
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