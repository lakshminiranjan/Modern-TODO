-- Create a stored procedure to manage profiles
-- This function will be used to create or update profiles
-- It bypasses RLS because it's executed with definer's rights

CREATE OR REPLACE FUNCTION manage_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_avatar_url TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
SET search_path = public
AS $$
BEGIN
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    -- Update existing profile
    UPDATE profiles
    SET 
      full_name = COALESCE(p_full_name, full_name),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = now()
    WHERE id = p_user_id;
  ELSE
    -- Insert new profile
    INSERT INTO profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (p_user_id, p_full_name, p_avatar_url, now(), now());
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in manage_profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION manage_profile TO authenticated, anon, service_role;

-- Comment on function
COMMENT ON FUNCTION manage_profile IS 'Creates or updates a user profile, bypassing RLS';