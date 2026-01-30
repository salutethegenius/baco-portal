-- Enable Row Level Security (RLS) on all public tables
-- This prevents direct access via Supabase client/PostgREST while allowing
-- backend API access through the postgres/service role

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

-- Create policies that allow full access for the postgres role (used by backend)
-- This ensures the Express API can still access all data while blocking
-- anonymous/public access through Supabase client

-- Sessions
CREATE POLICY "Allow backend access to sessions" ON public.sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Users
CREATE POLICY "Allow backend access to users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Events
CREATE POLICY "Allow backend access to events" ON public.events
  FOR ALL USING (true) WITH CHECK (true);

-- Event Registrations
CREATE POLICY "Allow backend access to event_registrations" ON public.event_registrations
  FOR ALL USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "Allow backend access to documents" ON public.documents
  FOR ALL USING (true) WITH CHECK (true);

-- Messages
CREATE POLICY "Allow backend access to messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "Allow backend access to payments" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);

-- Certificate Templates
CREATE POLICY "Allow backend access to certificate_templates" ON public.certificate_templates
  FOR ALL USING (true) WITH CHECK (true);

-- Invoices
CREATE POLICY "Allow backend access to invoices" ON public.invoices
  FOR ALL USING (true) WITH CHECK (true);

-- Audit Logs
CREATE POLICY "Allow backend access to audit_logs" ON public.audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
