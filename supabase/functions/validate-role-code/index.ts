import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidateRoleCodeRequest {
  code: string;
}

interface ValidateRoleCodeResponse {
  valid: boolean;
  role?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ valid: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { code } = (await req.json()) as ValidateRoleCodeRequest;

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid code format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ valid: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the signup_codes table
    const { data: signupCode, error: queryError } = await supabase
      .from("signup_codes")
      .select("id, code, role, is_active, max_uses, current_uses, expires_at")
      .eq("code", trimmedCode)
      .maybeSingle();

    if (queryError) {
      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({ valid: false, error: "Failed to validate code" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Code doesn't exist
    if (!signupCode) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid signup code" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if code is active
    if (!signupCode.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: "Code is inactive" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if code has expired
    if (signupCode.expires_at) {
      const expiresAt = new Date(signupCode.expires_at);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: "Code expired or inactive" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Check if code usage limit has been reached
    if (signupCode.max_uses && signupCode.current_uses >= signupCode.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "Code usage limit reached" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response: ValidateRoleCodeResponse = {
      valid: true,
      role: signupCode.role,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error validating role code:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
