-- Run this ONCE in Supabase SQL Editor to make your account a builder.
-- Replace the email below with the email you used to sign up.

UPDATE public.profiles
SET role = 'builder'
WHERE email = 'YOUR_EMAIL_HERE@example.com';
