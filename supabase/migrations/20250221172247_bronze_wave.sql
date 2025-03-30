/*
  # Add chat participants tracking

  1. New Tables
    - `chat_participants`
      - `chat_id` (text, references chats)
      - `user_name` (text)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_participants` table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, user_name)
);

ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read chat participants
CREATE POLICY "Anyone can read chat participants"
  ON chat_participants
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert chat participants
CREATE POLICY "Anyone can insert chat participants"
  ON chat_participants
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS chat_participants_chat_id_idx ON chat_participants(chat_id);