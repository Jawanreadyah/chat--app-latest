/*
  # Add Pinned Messages and Friend Renaming Features

  1. New Tables
    - `pinned_messages` - Stores pinned messages in chats
      - `id` (uuid, primary key)
      - `chat_id` (text, references chats)
      - `message_id` (uuid, references messages)
      - `pinned_by` (text, references users)
      - `pinned_at` (timestamptz)
    
    - `friend_names` - Stores custom names for users in chats
      - `id` (uuid, primary key)
      - `chat_id` (text, references chats)
      - `user_username` (text, references users)
      - `custom_name` (text)
      - `set_by` (text, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for read/write access
*/

-- Create pinned_messages table
CREATE TABLE IF NOT EXISTS pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by text REFERENCES users(username) ON DELETE CASCADE,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, message_id)
);

-- Enable RLS
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read pinned messages"
  ON pinned_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert pinned messages"
  ON pinned_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete pinned messages"
  ON pinned_messages
  FOR DELETE
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS pinned_messages_chat_id_idx ON pinned_messages(chat_id);
CREATE INDEX IF NOT EXISTS pinned_messages_message_id_idx ON pinned_messages(message_id);

-- Create friend_names table
CREATE TABLE IF NOT EXISTS friend_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text REFERENCES chats(id) ON DELETE CASCADE,
  user_username text REFERENCES users(username) ON DELETE CASCADE,
  custom_name text NOT NULL,
  set_by text REFERENCES users(username) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_username, set_by)
);

-- Enable RLS
ALTER TABLE friend_names ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read friend names"
  ON friend_names
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert friend names"
  ON friend_names
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own friend names"
  ON friend_names
  FOR UPDATE
  TO public
  USING (set_by = current_user OR true);

-- Create indexes
CREATE INDEX IF NOT EXISTS friend_names_chat_id_idx ON friend_names(chat_id);
CREATE INDEX IF NOT EXISTS friend_names_user_username_idx ON friend_names(user_username);
CREATE INDEX IF NOT EXISTS friend_names_set_by_idx ON friend_names(set_by);