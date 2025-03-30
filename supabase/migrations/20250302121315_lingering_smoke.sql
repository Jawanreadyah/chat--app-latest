/*
  # Fix User Profiles

  1. New Functions
    - `get_user_profile` - Function to fetch user profile data including avatar and bio
  
  2. Changes
    - Add function to retrieve user profile data
    - This will be used to display avatars and bio information for other users
*/

-- Create a function to get user profile data
CREATE OR REPLACE FUNCTION get_user_profile(username_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'username', username,
    'avatar', avatar,
    'display_name', display_name,
    'bio', bio,
    'location', location,
    'last_profile_update', last_profile_update
  ) INTO user_data
  FROM users
  WHERE username = username_param;
  
  RETURN user_data;
END;
$$;

-- Create a policy to allow access to the function
GRANT EXECUTE ON FUNCTION get_user_profile TO public;