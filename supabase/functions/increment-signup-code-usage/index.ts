import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@^2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IncrementCodeUsageRequest {
  code: string;
}

interface IncrementCodeUsageResponse {
  success: boolean;
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
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { code } = (await req.json()) as IncrementCodeUsageRequest;

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current usage count
    const { data: signupCode, error: queryError } = await supabase
      .from("signup_codes")
      .select("current_uses")
      .eq("code", trimmedCode)
      .maybeSingle();

    if (queryError) {
      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update code usage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!signupCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Code not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Increment the usage count
    const { error: updateError } = await supabase
      .from("signup_codes")
      .update({ current_uses: (signupCode.current_uses || 0) + 1 })
      .eq("code", trimmedCode);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update code usage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response: IncrementCodeUsageResponse = {
      success: true,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error incrementing code usage:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
