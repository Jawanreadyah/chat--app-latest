/*
  # Create blocked users table

  1. New Tables
    - `blocked_users`
      - `blocker_username` (text, references users)
      - `blocked_username` (text, references users)
      - `chat_id` (text, references chats)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `blocked_users` table
    - Add policies for reading and inserting blocked users
*/

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_username text REFERENCES users(username) ON DELETE CASCADE,
  blocked_username text REFERENCES users(username) ON DELETE CASCADE,
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_username, blocked_username, chat_id)
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON blocked_users(blocker_username);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON blocked_users(blocked_username);
CREATE INDEX IF NOT EXISTS blocked_users_chat_idx ON blocked_users(chat_id);

-- Create policies
CREATE POLICY "Anyone can read blocked users"
  ON blocked_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert blocked users"
  ON blocked_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete blocked users"
  ON blocked_users
  FOR DELETE
  TO public
  USING (true);