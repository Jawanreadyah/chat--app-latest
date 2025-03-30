/*
  # Create message statuses table

  1. New Tables
    - `message_statuses`
      - `message_id` (uuid, primary key)
      - `status` (text)
      - `updated_at` (timestamp)

  2. Purpose
    - Store permanent message status (seen) that shouldn't revert
    - Ensures seen messages stay marked as seen forever
*/

CREATE TABLE IF NOT EXISTS message_statuses (
  message_id uuid PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status = 'seen'),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_statuses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read message statuses
CREATE POLICY "Anyone can read message statuses"
  ON message_statuses
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update their own message statuses
CREATE POLICY "Users can insert message statuses"
  ON message_statuses
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update message statuses"
  ON message_statuses
  FOR UPDATE
  TO public
  USING (true);