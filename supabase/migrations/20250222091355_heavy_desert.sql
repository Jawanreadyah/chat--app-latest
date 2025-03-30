/*
  # User Status and Active Calls Tables

  1. New Tables
    - `user_statuses`
      - `username` (text, primary key, references users)
      - `status` (text, enum: online, busy, away, offline)
      - `last_updated` (timestamptz)
    - `active_calls`
      - `id` (uuid, primary key)
      - `chat_id` (text, references chats)
      - `caller_username` (text, references users)
      - `recipient_username` (text, references users)
      - `status` (text, enum: pending, accepted, declined, ended)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for read/write access
    
  3. Indexes
    - Index on active_calls(recipient_username, status)
    - Index on user_statuses(last_updated)
*/

-- Create user_statuses table
CREATE TABLE IF NOT EXISTS user_statuses (
  username text PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('online', 'busy', 'away', 'offline')),
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for user_statuses
CREATE POLICY "Anyone can read user statuses"
  ON user_statuses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can modify their status"
  ON user_statuses
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create active_calls table
CREATE TABLE IF NOT EXISTS active_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  caller_username text REFERENCES users(username) ON DELETE CASCADE,
  recipient_username text REFERENCES users(username) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'ended')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for active_calls
CREATE POLICY "Anyone can read active calls"
  ON active_calls
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can modify active calls"
  ON active_calls
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS active_calls_recipient_status_idx ON active_calls(recipient_username, status);
CREATE INDEX IF NOT EXISTS user_statuses_last_updated_idx ON user_statuses(last_updated);