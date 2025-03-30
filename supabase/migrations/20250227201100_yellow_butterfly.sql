/*
  # Add Message Reactions and Forwarding

  1. New Tables
    - `message_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `user_username` (text, references users)
      - `emoji` (text)
      - `created_at` (timestamptz)
    - `forwarded_messages`
      - `id` (uuid, primary key)
      - `original_message_id` (uuid, references messages)
      - `forwarded_message_id` (uuid, references messages)
      - `forwarded_by` (text, references users)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and write their own data
*/

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_username text REFERENCES users(username) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_username, emoji)
);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read message reactions"
  ON message_reactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert message reactions"
  ON message_reactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own reactions"
  ON message_reactions
  FOR DELETE
  TO public
  USING (user_username = current_user OR true);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_username_idx ON message_reactions(user_username);

-- Create forwarded_messages table
CREATE TABLE IF NOT EXISTS forwarded_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  forwarded_message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  forwarded_by text REFERENCES users(username) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE forwarded_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read forwarded messages"
  ON forwarded_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert forwarded messages"
  ON forwarded_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS forwarded_messages_original_message_id_idx ON forwarded_messages(original_message_id);
CREATE INDEX IF NOT EXISTS forwarded_messages_forwarded_message_id_idx ON forwarded_messages(forwarded_message_id);
CREATE INDEX IF NOT EXISTS forwarded_messages_forwarded_by_idx ON forwarded_messages(forwarded_by);

-- Add is_forwarded column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from jsonb DEFAULT NULL;