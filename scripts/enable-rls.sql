-- Enable Row Level Security (RLS) on all public tables
-- This prevents direct access via Supabase client (anon/authenticated roles)
-- while allowing backend API access through the postgres (service) role

-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies that ONLY allow the postgres role (service role used by backend)
-- This blocks anon and authenticated roles from direct Supabase client access

-- Sessions - service role only
CREATE POLICY "Service role access to sessions" ON public.sessions
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Users - service role only  
CREATE POLICY "Service role access to users" ON public.users
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Events - service role only
CREATE POLICY "Service role access to events" ON public.events
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Event Registrations - service role only
CREATE POLICY "Service role access to event_registrations" ON public.event_registrations
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Documents - service role only
CREATE POLICY "Service role access to documents" ON public.documents
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Messages - service role only
CREATE POLICY "Service role access to messages" ON public.messages
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Payments - service role only
CREATE POLICY "Service role access to payments" ON public.payments
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Certificate Templates - service role only
CREATE POLICY "Service role access to certificate_templates" ON public.certificate_templates
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Invoices - service role only
CREATE POLICY "Service role access to invoices" ON public.invoices
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Audit Logs - service role only
CREATE POLICY "Service role access to audit_logs" ON public.audit_logs
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- Verify RLS and policies are configured correctly
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
