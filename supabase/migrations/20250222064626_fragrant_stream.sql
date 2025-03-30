-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read their own data" ON users;
  DROP POLICY IF EXISTS "Users can insert their own data" ON users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create users table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS users (
    username text PRIMARY KEY,
    password_hash text NOT NULL DEFAULT '',
    avatar text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT proper_password_hash CHECK (password_hash <> '')
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

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
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Add function to hash password during registration
CREATE OR REPLACE FUNCTION hash_password() RETURNS trigger AS $$
BEGIN
  NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically hash passwords
DO $$ BEGIN
  CREATE TRIGGER hash_password_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION hash_password();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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