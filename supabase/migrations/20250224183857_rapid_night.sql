/*
  # Add Call Logs Table

  1. New Tables
    - `call_logs`
      - `id` (uuid, primary key)
      - `caller_username` (text, references users)
      - `recipient_username` (text, references users)
      - `chat_id` (text, references chats)
      - `status` (text: 'completed', 'missed', 'declined')
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
      - `duration` (integer, in seconds)

  2. Security
    - Enable RLS on `call_logs` table
    - Add policies for authenticated users to read their own call logs
*/

CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_username text REFERENCES users(username) ON DELETE CASCADE,
  recipient_username text REFERENCES users(username) ON DELETE CASCADE,
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('completed', 'missed', 'declined')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration integer,
  CONSTRAINT valid_duration CHECK (
    (status = 'completed' AND duration IS NOT NULL AND duration >= 0) OR
    (status IN ('missed', 'declined') AND duration IS NULL)
  )
);

-- Enable RLS
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS call_logs_caller_username_idx ON call_logs(caller_username);
CREATE INDEX IF NOT EXISTS call_logs_recipient_username_idx ON call_logs(recipient_username);
CREATE INDEX IF NOT EXISTS call_logs_started_at_idx ON call_logs(started_at);

-- Create policies
CREATE POLICY "Users can read their own call logs"
  ON call_logs
  FOR SELECT
  TO public
  USING (caller_username = current_user OR recipient_username = current_user);

CREATE POLICY "Users can insert their own call logs"
  ON call_logs
  FOR INSERT
  TO public
  WITH CHECK (true);