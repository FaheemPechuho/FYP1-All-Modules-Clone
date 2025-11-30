-- ============================================================================
-- CREATE SUPER ADMIN USER
-- ============================================================================
-- This script links an existing auth.users account to public.users with 
-- super_admin role, giving them full administrative access.
-- ============================================================================

DO $$
DECLARE
    user_auth_id UUID;
    user_email TEXT := 'testsuperadmin@example.com';
    user_full_name TEXT := 'Super Admin'; -- Change this if needed
    user_role TEXT := 'super_admin';
BEGIN
    -- 1. Find the user ID from auth.users
    SELECT id INTO user_auth_id 
    FROM auth.users 
    WHERE email = user_email;

    -- 2. Check if user exists in auth.users
    IF user_auth_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users. Please create the user in Supabase Authentication first.', user_email;
    END IF;

    -- 3. Temporarily disable validation trigger
    EXECUTE 'ALTER TABLE public.users DISABLE TRIGGER before_user_update_validation';
    
    -- 4. Insert or update user in public.users with super_admin role
    INSERT INTO public.users (id, full_name, email, role, manager_id)
    VALUES (user_auth_id, user_full_name, user_email, user_role, NULL)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
    
    -- 5. Re-enable validation trigger
    EXECUTE 'ALTER TABLE public.users ENABLE TRIGGER before_user_update_validation';

    RAISE NOTICE '✅ Super Admin setup complete!';
    RAISE NOTICE 'User ID: %', user_auth_id;
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Role: %', user_role;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 You can now login with:';
    RAISE NOTICE '   Email: %', user_email;
    RAISE NOTICE '   Password: <the password you set in Authentication>';
END $$;

