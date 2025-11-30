-- ============================================================================
-- CREATE CLARA AI AGENT USER
-- ============================================================================
-- Run this script in Supabase SQL Editor to create the Clara AI agent user
-- This creates the user in both auth.users and public.users tables
-- ============================================================================

DO $$
DECLARE
    clara_user_id UUID;
    clara_email TEXT := 'clara@trendtialcrm.ai';
    clara_password TEXT := 'ClaraAI@2024!SecurePassword';
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO clara_user_id 
    FROM auth.users 
    WHERE email = clara_email;
    
    IF clara_user_id IS NULL THEN
        -- Generate a new UUID for the user
        clara_user_id := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            clara_user_id,
            'authenticated',
            'authenticated',
            clara_email,
            crypt(clara_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"],"role":"agent"}',
            '{"full_name":"Clara AI Voice Assistant"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Created user in auth.users with ID: %', clara_user_id;
    ELSE
        RAISE NOTICE 'User already exists in auth.users with ID: %', clara_user_id;
    END IF;
    
    -- Insert or update in public.users
    INSERT INTO public.users (
        id,
        full_name,
        email,
        role,
        manager_id
    ) VALUES (
        clara_user_id,
        'Clara AI Voice Assistant',
        clara_email,
        'agent',
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
    
    RAISE NOTICE 'Created/Updated user in public.users';
    RAISE NOTICE '✅ Clara AI Agent setup complete!';
    RAISE NOTICE 'User ID: %', clara_user_id;
    RAISE NOTICE 'Email: %', clara_email;
    RAISE NOTICE 'Password: %', clara_password;
    
END $$;

-- Verify the user was created
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    au.email_confirmed_at,
    au.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'clara@trendtialcrm.ai';

