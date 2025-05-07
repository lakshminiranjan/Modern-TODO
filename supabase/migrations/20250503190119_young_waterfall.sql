/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to:
      - Read their own profile
      - Create their own profile
      - Update their own profile
*/

-- Drop existing policies if they exist
-- The following policies are managed by a newer migration (20250507000000_fix_profiles_rls.sql)
-- All old DROP POLICY statements related to 'profiles' are commented out to let the newer migration handle RLS.
-- DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
-- DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
-- "Enable all operations for authenticated users" is created by this migration and explicitly dropped by 20250507000000_fix_profiles_rls.sql
-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;
-- DROP POLICY IF EXISTS "Enable all operations for users based on id" ON profiles;
-- DROP POLICY IF EXISTS "Enable read for users based on id" ON profiles;
-- DROP POLICY IF EXISTS "Enable insert for users based on id" ON profiles;
-- DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all operations (Commented out to be handled by newer migration)
-- CREATE POLICY "Enable all operations for authenticated users"
--   ON profiles
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON profiles TO authenticated; -- Handled by newer migration
-- GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated; -- This sequence does not exist for a UUID primary key

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE
  ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();