/*
  # Create chats table

  1. New Tables
    - `chats`
      - `id` (text, primary key)
      - `name` (text)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `last_message` (text, nullable)

  2. Security
    - Enable RLS on `chats` table
    - Add policies for public access to chats
*/

CREATE TABLE IF NOT EXISTS chats (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_message text
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read chats
CREATE POLICY "Anyone can read chats"
  ON chats
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert chats
CREATE POLICY "Anyone can insert chats"
  ON chats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update chats
CREATE POLICY "Anyone can update chats"
  ON chats
  FOR UPDATE
  TO public
  USING (true);