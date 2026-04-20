// import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// }

// interface RequestBody {
//   email: string
//   newPassword: string
// }

// Deno.serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { headers: corsHeaders })
//   }

//   try {
//     // Create Supabase client with service role key for admin operations
//     const supabaseAdmin = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     )

//     const { email, newPassword }: RequestBody = await req.json()

//     if (!email || !newPassword) {
//       return new Response(
//         JSON.stringify({ error: 'Email and new password are required' }),
//         { 
//           status: 400, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//         }
//       )
//     }

//     if (newPassword.length < 6) {
//       return new Response(
//         JSON.stringify({ error: 'Password must be at least 6 characters long' }),
//         { 
//           status: 400, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//         }
//       )
//     }

//     // First, verify the user exists in our user_profiles table
//     const { data: profile, error: profileError } = await supabaseAdmin
//       .from('user_profiles')
//       .select('id, email')
//       .eq('email', email.toLowerCase().trim())
//       .single()

//     if (profileError || !profile) {
//       return new Response(
//         JSON.stringify({ error: 'User not found' }),
//         { 
//           status: 404, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//         }
//       )
//     }

//     // Update the user's password using Supabase Admin API
//     const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
//       profile.id,
//       { password: newPassword }
//     )

//     if (updateError) {
//       console.error('Error updating password:', updateError)
//       return new Response(
//         JSON.stringify({ error: 'Failed to update password' }),
//         { 
//           status: 500, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//         }
//       )
//     }

//     return new Response(
//       JSON.stringify({ success: true, message: 'Password updated successfully' }),
//       { 
//         status: 200, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//       }
//     )

//   } catch (error) {
//     console.error('Error in reset-password function:', error)
//     return new Response(
//       JSON.stringify({ error: 'Internal server error' }),
//       { 
//         status: 500, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//       }
//     )
//   }
// })