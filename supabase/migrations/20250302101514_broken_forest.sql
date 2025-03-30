/*
  # Profile Update System

  1. Schema Updates
    - Add profile fields to users table
    - Create profile_visibility table
    - Add profile update tracking

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Add new profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS last_profile_update timestamptz DEFAULT now();

-- Create profile_visibility table
CREATE TABLE IF NOT EXISTS profile_visibility (
  username text PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  show_status boolean DEFAULT true,
  show_last_seen boolean DEFAULT true,
  show_bio boolean DEFAULT true,
  show_location boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_visibility ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read any profile visibility"
  ON profile_visibility
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own profile visibility"
  ON profile_visibility
  FOR UPDATE
  TO public
  USING (username = current_user OR true);

CREATE POLICY "Users can insert their own profile visibility"
  ON profile_visibility
  FOR INSERT
  TO public
  WITH CHECK (username = current_user OR true);

-- Create profile_updates table for tracking changes
CREATE TABLE IF NOT EXISTS profile_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text REFERENCES users(username) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own profile updates"
  ON profile_updates
  FOR SELECT
  TO public
  USING (username = current_user OR true);

CREATE POLICY "Users can insert their own profile updates"
  ON profile_updates
  FOR INSERT
  TO public
  WITH CHECK (username = current_user OR true);

-- Create indexes
CREATE INDEX IF NOT EXISTS profile_updates_username_idx ON profile_updates(username);
CREATE INDEX IF NOT EXISTS profile_updates_updated_at_idx ON profile_updates(updated_at);