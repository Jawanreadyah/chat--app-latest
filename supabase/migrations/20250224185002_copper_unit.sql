-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can insert their own call logs" ON call_logs;

-- Create new policies with correct access rules
CREATE POLICY "Anyone can read call logs"
  ON call_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert call logs"
  ON call_logs
  FOR INSERT
  TO public
  WITH CHECK (true);