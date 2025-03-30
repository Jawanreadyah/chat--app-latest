-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  username text PRIMARY KEY,
  password_hash text NOT NULL,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create index for username lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- Create function to check password
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

-- Drop and recreate policies to avoid deadlocks
DO $$ 
BEGIN
  -- Attempt to drop policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Users can read their own data" ON users;
  EXCEPTION 
    WHEN undefined_object THEN 
      NULL;
  END;

  BEGIN
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
  EXCEPTION 
    WHEN undefined_object THEN 
      NULL;
  END;

  -- Create new policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read their own data'
  ) THEN
    CREATE POLICY "Users can read their own data"
      ON users
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can insert their own data'
  ) THEN
    CREATE POLICY "Users can insert their own data"
      ON users
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;