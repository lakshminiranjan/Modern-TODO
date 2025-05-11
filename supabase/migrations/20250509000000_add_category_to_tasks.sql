/*
  # Add category column to tasks table
  
  This migration adds a 'category' column to the tasks table to allow
  categorization of tasks (work, personal, shopping, health, education, finance).
*/

-- Add category column with default value 'work'
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'work';

-- Add comment to the column
COMMENT ON COLUMN tasks.category IS 'Task category (work, personal, shopping, health, education, finance)';

-- Update existing tasks to have a category if they don't already
UPDATE tasks 
SET category = 'work' 
WHERE category IS NULL OR category = '';