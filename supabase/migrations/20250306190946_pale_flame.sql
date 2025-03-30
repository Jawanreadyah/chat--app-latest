/*
  # Add Permanent Friend Codes

  1. New Tables
    - `permanent_friend_codes`
      - `code` (text, primary key) - The permanent friend code
      - `chat_id` (text) - Reference to the chat
      - `created_at` (timestamptz) - When the code was created
      - `created_by` (text) - Who created the code

  2. Changes
    - Add unique constraint to ensure one code per chat
    - Add foreign key to chats table
    - Enable RLS for security

  3. Security
    - Enable RLS
    - Add policies for insert and select
*/

-- Create permanent friend codes table
CREATE TABLE IF NOT EXISTS permanent_friend_codes (
  code text PRIMARY KEY,
  chat_id text NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  UNIQUE(chat_id)
);

-- Enable RLS
ALTER TABLE permanent_friend_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read permanent friend codes" 
  ON permanent_friend_codes
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Chat creators can create permanent friend codes" 
  ON permanent_friend_codes
  FOR INSERT 
  TO public 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE id = chat_id 
      AND created_by = created_by
    )
  );