-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- Create paystub status enum
CREATE TYPE public.paystub_status AS ENUM ('draft', 'completed', 'downloaded');

-- Create pay frequency enum
CREATE TYPE public.pay_frequency AS ENUM ('weekly', 'bi_weekly', 'semi_monthly', 'monthly');

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- USER ROLES TABLE (separate from profiles)
-- ============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- ============================================
-- EMPLOYERS TABLE
-- ============================================
CREATE TABLE public.employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    ein TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    ssn_last_four TEXT,
    employee_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- PAYSTUBS TABLE
-- ============================================
CREATE TABLE public.paystubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    employer_id UUID REFERENCES public.employers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    template_id TEXT DEFAULT 'classic',
    status paystub_status DEFAULT 'draft',
    pay_frequency pay_frequency DEFAULT 'bi_weekly',
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    -- Earnings
    regular_hours DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    salary_amount DECIMAL(10,2) DEFAULT 0,
    is_hourly BOOLEAN DEFAULT true,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    overtime_rate DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    tips DECIMAL(10,2) DEFAULT 0,
    other_earnings DECIMAL(10,2) DEFAULT 0,
    -- Deductions
    federal_tax DECIMAL(10,2) DEFAULT 0,
    state_tax DECIMAL(10,2) DEFAULT 0,
    social_security DECIMAL(10,2) DEFAULT 0,
    medicare DECIMAL(10,2) DEFAULT 0,
    retirement_401k DECIMAL(10,2) DEFAULT 0,
    health_insurance DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    -- Totals
    gross_pay DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    -- YTD
    ytd_gross DECIMAL(10,2) DEFAULT 0,
    ytd_federal_tax DECIMAL(10,2) DEFAULT 0,
    ytd_state_tax DECIMAL(10,2) DEFAULT 0,
    ytd_social_security DECIMAL(10,2) DEFAULT 0,
    ytd_medicare DECIMAL(10,2) DEFAULT 0,
    ytd_net DECIMAL(10,2) DEFAULT 0,
    -- Metadata
    state_code TEXT DEFAULT 'CA',
    is_watermarked BOOLEAN DEFAULT true,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_type TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stubs_generated_this_month INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    paystub_id UUID REFERENCES public.paystubs(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- TAX RATES TABLE (publicly readable)
-- ============================================
CREATE TABLE public.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    federal_rate DECIMAL(5,4) DEFAULT 0.22,
    state_rate DECIMAL(5,4) DEFAULT 0,
    social_security_rate DECIMAL(5,4) DEFAULT 0.062,
    medicare_rate DECIMAL(5,4) DEFAULT 0.0145,
    has_state_tax BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (state_code, version)
);

-- ============================================
-- TEMPLATES TABLE (publicly readable)
-- ============================================
CREATE TABLE public.templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preview_image_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    industry_tags TEXT[],
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- BLOG POSTS TABLE (publicly readable)
-- ============================================
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    category TEXT,
    featured_image_url TEXT,
    author_name TEXT DEFAULT 'PaystubPro Team',
    seo_title TEXT,
    seo_description TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- FAQS TABLE (publicly readable)
-- ============================================
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- GENERATION LOGS TABLE
-- ============================================
CREATE TABLE public.generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    paystub_id UUID REFERENCES public.paystubs(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- FRAUD FLAGS TABLE
-- ============================================
CREATE TABLE public.fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create default subscription (free tier)
    INSERT INTO public.subscriptions (user_id, plan_type, status)
    VALUES (NEW.id, 'free', 'active');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON public.employers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paystubs_updated_at BEFORE UPDATE ON public.paystubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Roles (admin only)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Employers
CREATE POLICY "Users can view own employers" ON public.employers FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create employers" ON public.employers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employers" ON public.employers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employers" ON public.employers FOR DELETE USING (auth.uid() = user_id);

-- Employees
CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE USING (auth.uid() = user_id);

-- Paystubs
CREATE POLICY "Users can view own paystubs" ON public.paystubs FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create paystubs" ON public.paystubs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paystubs" ON public.paystubs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paystubs" ON public.paystubs FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tax Rates (publicly readable)
CREATE POLICY "Anyone can view tax rates" ON public.tax_rates FOR SELECT USING (true);

-- Templates (publicly readable)
CREATE POLICY "Anyone can view templates" ON public.templates FOR SELECT USING (true);

-- Blog Posts (publicly readable when published)
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins can manage posts" ON public.blog_posts FOR ALL USING (public.is_admin());

-- FAQs (publicly readable)
CREATE POLICY "Anyone can view FAQs" ON public.faqs FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins can manage FAQs" ON public.faqs FOR ALL USING (public.is_admin());

-- Generation Logs
CREATE POLICY "Users can create own logs" ON public.generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all logs" ON public.generation_logs FOR SELECT USING (public.is_admin());

-- Audit Logs (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_moderator_or_admin());

-- Fraud Flags
CREATE POLICY "Users can view own flags" ON public.fraud_flags FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage flags" ON public.fraud_flags FOR ALL USING (public.is_admin());

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default templates
INSERT INTO public.templates (id, name, description, is_premium, industry_tags) VALUES
('classic', 'Classic Professional', 'Clean and professional design suitable for any industry', false, ARRAY['general', 'corporate']),
('modern', 'Modern Minimal', 'Sleek contemporary design with minimal styling', false, ARRAY['tech', 'startup']),
('corporate', 'Corporate Executive', 'Premium corporate design for executive-level employees', true, ARRAY['corporate', 'finance']),
('healthcare', 'Healthcare Standard', 'Specialized template for healthcare industry', true, ARRAY['healthcare', 'medical']),
('construction', 'Construction & Trade', 'Designed for construction and trade industries', true, ARRAY['construction', 'trade']);

-- Insert US state tax rates
INSERT INTO public.tax_rates (state_code, state_name, state_rate, has_state_tax) VALUES
('AL', 'Alabama', 0.05, true),
('AK', 'Alaska', 0, false),
('AZ', 'Arizona', 0.0259, true),
('AR', 'Arkansas', 0.055, true),
('CA', 'California', 0.0725, true),
('CO', 'Colorado', 0.044, true),
('CT', 'Connecticut', 0.0699, true),
('DE', 'Delaware', 0.066, true),
('FL', 'Florida', 0, false),
('GA', 'Georgia', 0.0549, true),
('HI', 'Hawaii', 0.0825, true),
('ID', 'Idaho', 0.058, true),
('IL', 'Illinois', 0.0495, true),
('IN', 'Indiana', 0.0315, true),
('IA', 'Iowa', 0.06, true),
('KS', 'Kansas', 0.057, true),
('KY', 'Kentucky', 0.045, true),
('LA', 'Louisiana', 0.0425, true),
('ME', 'Maine', 0.0715, true),
('MD', 'Maryland', 0.0575, true),
('MA', 'Massachusetts', 0.05, true),
('MI', 'Michigan', 0.0425, true),
('MN', 'Minnesota', 0.0985, true),
('MS', 'Mississippi', 0.05, true),
('MO', 'Missouri', 0.054, true),
('MT', 'Montana', 0.0675, true),
('NE', 'Nebraska', 0.0684, true),
('NV', 'Nevada', 0, false),
('NH', 'New Hampshire', 0, false),
('NJ', 'New Jersey', 0.1075, true),
('NM', 'New Mexico', 0.059, true),
('NY', 'New York', 0.0882, true),
('NC', 'North Carolina', 0.0475, true),
('ND', 'North Dakota', 0.029, true),
('OH', 'Ohio', 0.04, true),
('OK', 'Oklahoma', 0.0475, true),
('OR', 'Oregon', 0.099, true),
('PA', 'Pennsylvania', 0.0307, true),
('RI', 'Rhode Island', 0.0599, true),
('SC', 'South Carolina', 0.065, true),
('SD', 'South Dakota', 0, false),
('TN', 'Tennessee', 0, false),
('TX', 'Texas', 0, false),
('UT', 'Utah', 0.0465, true),
('VT', 'Vermont', 0.0875, true),
('VA', 'Virginia', 0.0575, true),
('WA', 'Washington', 0, false),
('WV', 'West Virginia', 0.065, true),
('WI', 'Wisconsin', 0.0765, true),
('WY', 'Wyoming', 0, false);

-- Insert sample FAQs
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
('What is a paystub?', 'A paystub (also called a pay slip or earnings statement) is a document that details an employee''s wages, deductions, and net pay for a specific pay period.', 'general', 1),
('Are your paystubs legally compliant?', 'Yes! Our paystubs are designed to meet federal and state requirements for all 50 US states. They include all necessary information required by law.', 'compliance', 2),
('How quickly can I generate a paystub?', 'You can generate a professional paystub in under 60 seconds using our easy-to-use wizard.', 'general', 3),
('What payment methods do you accept?', 'We accept all major credit cards, debit cards, and PayPal through our secure payment processor.', 'billing', 4),
('Can I edit a paystub after creating it?', 'Yes, you can edit and regenerate paystubs from your dashboard. Changes are saved automatically.', 'features', 5);