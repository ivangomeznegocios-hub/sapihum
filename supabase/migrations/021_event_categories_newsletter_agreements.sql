-- ============================================
-- Migration 021: Event Categories, Newsletters, Exclusive Agreements
-- ============================================

-- 1. Add category and subcategory columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE events ADD COLUMN IF NOT EXISTS subcategory text;

-- Add check constraint for valid categories
ALTER TABLE events ADD CONSTRAINT events_category_check 
    CHECK (category IN ('general', 'networking', 'clinical', 'business'));

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);

-- 2. Create newsletters table
CREATE TABLE IF NOT EXISTS newsletters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    summary text,
    content_html text NOT NULL,
    cover_image_url text,
    month integer NOT NULL CHECK (month >= 1 AND month <= 12),
    year integer NOT NULL CHECK (year >= 2024),
    is_active boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Only one active newsletter at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletters_active 
    ON newsletters (is_active) WHERE is_active = true;

-- Index for month/year lookup
CREATE INDEX IF NOT EXISTS idx_newsletters_month_year ON newsletters (year DESC, month DESC);

-- RLS for newsletters
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Everyone can read active newsletters
CREATE POLICY "Anyone can read active newsletters"
    ON newsletters FOR SELECT
    USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage newsletters"
    ON newsletters FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. Create exclusive_agreements table
CREATE TABLE IF NOT EXISTS exclusive_agreements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text NOT NULL,
    company_logo_url text,
    description text NOT NULL,
    benefits text[] DEFAULT '{}',
    discount_code text,
    discount_percentage numeric(5,2),
    website_url text,
    contact_email text,
    category text NOT NULL DEFAULT 'general',
    is_active boolean NOT NULL DEFAULT true,
    start_date date,
    end_date date,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agreements_active ON exclusive_agreements (is_active);
CREATE INDEX IF NOT EXISTS idx_agreements_category ON exclusive_agreements (category);

-- RLS for exclusive_agreements
ALTER TABLE exclusive_agreements ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active agreements
CREATE POLICY "Authenticated users can read active agreements"
    ON exclusive_agreements FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins can do everything
CREATE POLICY "Admins can manage agreements"
    ON exclusive_agreements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_newsletters_updated_at ON newsletters;
CREATE TRIGGER update_newsletters_updated_at
    BEFORE UPDATE ON newsletters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agreements_updated_at ON exclusive_agreements;
CREATE TRIGGER update_agreements_updated_at
    BEFORE UPDATE ON exclusive_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
