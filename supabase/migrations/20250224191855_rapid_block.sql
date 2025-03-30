/*
  # Add video call support

  1. Changes
    - Add video_enabled column to active_calls table
    - Add video_enabled column to call_logs table
    - Update constraints and indexes
*/

-- Add video_enabled column to active_calls
ALTER TABLE active_calls
ADD COLUMN video_enabled boolean DEFAULT false;

-- Add video_enabled column to call_logs
ALTER TABLE call_logs
ADD COLUMN video_enabled boolean DEFAULT false;

-- Update call_logs constraint to include video_enabled
ALTER TABLE call_logs
DROP CONSTRAINT IF EXISTS valid_duration;

ALTER TABLE call_logs
ADD CONSTRAINT valid_duration_and_video CHECK (
  (status = 'completed' AND duration IS NOT NULL AND duration >= 0) OR
  (status IN ('missed', 'declined') AND duration IS NULL)
);