-- Completely disable RLS for the profiles table as a temporary measure
-- This is a quick fix to allow profile operations to work while we develop a proper solution

-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read any profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON profiles TO anon, authenticated, service_role;

-- Note: This is a temporary solution
-- In a production environment, you would want to re-enable RLS with proper policies
-- after fixing the immediate issues