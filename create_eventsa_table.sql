-- Create the eventsa table
CREATE TABLE IF NOT EXISTS public.eventsa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.eventsa ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users
-- Policy for SELECT operations
CREATE POLICY "Users can read own eventsa"
  ON public.eventsa
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can create own eventsa"
  ON public.eventsa
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations
CREATE POLICY "Users can update own eventsa"
  ON public.eventsa
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete own eventsa"
  ON public.eventsa
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
CREATE TRIGGER update_eventsa_updated_at
  BEFORE UPDATE
  ON public.eventsa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS eventsa_user_id_idx ON public.eventsa (user_id);
CREATE INDEX IF NOT EXISTS eventsa_start_time_idx ON public.eventsa (start_time);

-- Grant permissions to authenticated users
GRANT ALL ON public.eventsa TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE eventsa_id_seq TO authenticated;