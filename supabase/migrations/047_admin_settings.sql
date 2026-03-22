-- Create admin_settings table to store real CAC and Gross Margin
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    cac_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    gross_margin_percent DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users to admin_settings"
    ON public.admin_settings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for admins to admin_settings"
    ON public.admin_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable insert access for admins to admin_settings"
    ON public.admin_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default row
INSERT INTO public.admin_settings (id, cac_amount, gross_margin_percent)
VALUES ('default', 0, 85.00)
ON CONFLICT (id) DO NOTHING;
