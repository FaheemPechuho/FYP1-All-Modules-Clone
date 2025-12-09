# Deploy Edge Functions via Supabase Dashboard

Since Supabase CLI login can be complex, here's the easiest way to deploy your Edge Functions using the Supabase Dashboard.

---

## 📋 Your Edge Functions

You have **2 Edge Functions** to deploy:

1. **`create-user`** - Creates new user accounts
   - Location: `trendtialcrm/supabase/functions/create-user/index.ts`
   
2. **`reset-user-password`** - Handles password resets
   - Location: `trendtialcrm/supabase/functions/reset-user-password/index.ts`

---

## 🚀 Method 1: Deploy via Dashboard (Easiest)

### Step 1: Open Your Supabase Project

1. Go to: https://app.supabase.com/project/jtdrwkwsbufwhzahfesu
2. Click **"Edge Functions"** in the left sidebar

### Step 2: Deploy `create-user` Function

1. Click **"New function"**
2. Fill in the details:
   - **Name**: `create-user`
   - **Region**: Choose closest to you (e.g., `US East`)
   - **Verify JWT**: ✅ **ENABLED** (Check this box)
3. Click **"Create function"**
4. In the code editor, paste the contents from:
   `trendtialcrm/supabase/functions/create-user/index.ts`
5. Click **"Deploy"**

### Step 3: Deploy `reset-user-password` Function

1. Click **"New function"** again
2. Fill in the details:
   - **Name**: `reset-user-password`
   - **Region**: Same as above
   - **Verify JWT**: ❌ **DISABLED** (Leave unchecked)
3. Click **"Create function"**
4. In the code editor, paste the contents from:
   `trendtialcrm/supabase/functions/reset-user-password/index.ts`
5. Click **"Deploy"**

---

## 🔧 Method 2: Deploy via CLI (Alternative)

If you prefer using CLI, follow these steps:

### Prerequisites

You need a **Supabase Access Token**:

1. Go to: https://app.supabase.com/account/tokens
2. Click **"Generate new token"**
3. Give it a name (e.g., "Clara Edge Functions")
4. Copy the token (you'll only see it once!)

### Set Environment Variable

**PowerShell:**
```powershell
$env:SUPABASE_ACCESS_TOKEN="your_token_here"
```

**Or add to your session permanently:**
```powershell
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'your_token_here', 'User')
```

### Deploy Functions

```powershell
cd trendtialcrm
npx supabase functions deploy create-user --project-ref jtdrwkwsbufwhzahfesu
npx supabase functions deploy reset-user-password --project-ref jtdrwkwsbufwhzahfesu
```

---

## ✅ Verify Deployment

After deploying, verify they work:

### Test `create-user` Function

```bash
curl -i --location --request POST \
  'https://jtdrwkwsbufwhzahfesu.supabase.co/functions/v1/create-user' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "role": "agent"
  }'
```

### Test `reset-user-password` Function

```bash
curl -i --location --request POST \
  'https://jtdrwkwsbufwhzahfesu.supabase.co/functions/v1/reset-user-password' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid-here",
    "newPassword": "NewSecurePass123!"
  }'
```

---

## 📝 Function Code

### `create-user/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Create user function V2 started");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  try {
    console.log("Create user function: Attempting to read request body as text...");
    const rawBody = await req.text();
    console.log("Create user function: Raw request body:", rawBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (jsonError) {
      console.error("Create user function: JSON parsing error:", jsonError.message);
      return new Response(JSON.stringify({ error: "Invalid JSON format in request body", details: jsonError.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    
    console.log("Create user function: Parsed request body:", { 
      email: parsedBody.email, 
      full_name: parsedBody.full_name, 
      role: parsedBody.role, 
      manager_id: parsedBody.manager_id 
    });

    const { email, password, full_name, role, manager_id } = parsedBody;

    if (!email || !password || !full_name || !role) {
      console.warn("Create user function: Missing required fields.");
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      console.warn("Create user function: Password too short.");
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );
    console.log("Create user function: Admin client initialized");

    console.log("Create user function: Attempting to create user in Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name },
      app_metadata: { role }
    });

    if (authError) {
      console.error("Create user function: Auth error:", authError);
      return new Response(JSON.stringify({ error: authError.message || 'Failed to create user in Auth' }), {
        status: authError.status || 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!authData?.user?.id) {
        console.error("Create user function: Auth data missing user ID.");
        return new Response(JSON.stringify({ error: 'User created in Auth but ID missing' }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
    console.log("Create user function: User created in Auth. User ID:", authData.user.id);

    const dbPayload = {
      id: authData.user.id,
      full_name,
      email,
      role,
      manager_id: role === 'agent' ? (manager_id || null) : null,
    };
    console.log("Create user function: Attempting to insert user into DB with payload:", dbPayload);

    const { error: dbError } = await supabaseAdmin.from('users').insert(dbPayload);

    if (dbError) {
      console.error("Create user function: DB insert error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message || 'Failed to insert user into database' }), {
        status: dbError.code && !isNaN(parseInt(dbError.code)) ? parseInt(dbError.code) : 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    console.log("Create user function: User inserted into DB successfully");

    return new Response(JSON.stringify({ message: "User created successfully", userId: authData.user.id }), {
      status: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Create user function: General error catch block:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
```

### `reset-user-password/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Reset user password function started");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { userId, newPassword } = await req.json();
    console.log("Request body received for user:", userId);

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: "Missing required fields: userId and newPassword" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );
    console.log("Supabase admin client initialized for password reset.");

    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Auth update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message || 'Failed to update user password in Auth' }), {
        status: updateError.status || 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log("User password updated successfully for user:", userId);

    return new Response(JSON.stringify({ message: "User password updated successfully", user: data?.user }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("General error in reset-user-password function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
```

---

## 🎉 Done!

Your Edge Functions are now deployed and ready to use!

**Next Steps:**
1. Update `clara-backend/.env` with your new Supabase project credentials
2. Run `python scripts/verify_crm_integration.py` to test the integration
3. Start using Clara with your new database!

