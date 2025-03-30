/*
  # Messages Table Setup

  1. Table Creation
    - Creates messages table if it doesn't exist
    - Adds foreign key constraint to chats table
    - Adds performance index
  
  2. Security
    - Enables RLS
    - Creates policies for read and insert operations
*/

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL,
  user_info jsonb NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE messages
ADD CONSTRAINT messages_chat_id_fkey
FOREIGN KEY (chat_id)
REFERENCES chats(id)
ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);

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
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (true);