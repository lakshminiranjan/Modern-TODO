# Cursor-TODO

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/lakshminiranjan/Cursor-TODO)

## Environment Setup

This application requires the following environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is required for profile management operations to bypass Row Level Security (RLS) policies. Without this key, you may encounter RLS policy violations when creating or updating user profiles.