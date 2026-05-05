-- Drop profiles table and its trigger (auth.users handles identity)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists profiles;
