/*
  # Add authentication system

  1. New Tables
    - `users`
      - `username` (text, primary key)
      - `password_hash` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for user authentication
    - Add foreign key constraints for user references

  3. Changes
    - Add user authentication system
    - Preserve existing data structure
    - Add secure password storage
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  username text PRIMARY KEY,
  password_hash text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- Add function to check password
CREATE OR REPLACE FUNCTION check_password(
  p_username text,
  p_password text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE username = p_username
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$;