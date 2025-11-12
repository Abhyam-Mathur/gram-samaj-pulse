-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'panchayat_officer', 'public');

-- Create enum for asset types
CREATE TYPE public.asset_type AS ENUM ('pond', 'road', 'check_dam', 'well', 'canal', 'other');

-- Create enum for asset status
CREATE TYPE public.asset_status AS ENUM ('good', 'needs_repair', 'under_construction', 'damaged');

-- Create districts table
CREATE TABLE public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    blocks JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'public',
    district_id UUID REFERENCES public.districts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create mgnrega_data table for historical data
CREATE TABLE public.mgnrega_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    block_name TEXT NOT NULL,
    date DATE NOT NULL,
    person_days INTEGER NOT NULL,
    households_worked INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(district_id, block_name, date)
);

-- Create assets table
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    block_name TEXT NOT NULL,
    village_name TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    asset_name TEXT NOT NULL,
    description TEXT,
    status asset_status NOT NULL DEFAULT 'good',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    photos JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create forecasts table (cache for ML predictions)
CREATE TABLE public.forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    block_name TEXT NOT NULL,
    forecast_data JSONB NOT NULL,
    forecast_months INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(district_id, block_name, forecast_months)
);

-- Enable RLS on all tables
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mgnrega_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for districts (public read)
CREATE POLICY "Anyone can view districts"
ON public.districts FOR SELECT
USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for mgnrega_data (public read, admin write)
CREATE POLICY "Anyone can view MGNREGA data"
ON public.mgnrega_data FOR SELECT
USING (true);

CREATE POLICY "Admins can insert MGNREGA data"
ON public.mgnrega_data FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assets
CREATE POLICY "Anyone can view assets"
ON public.assets FOR SELECT
USING (true);

CREATE POLICY "Officers and Admins can create assets"
ON public.assets FOR INSERT
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'panchayat_officer')
);

CREATE POLICY "Officers and Admins can update assets"
ON public.assets FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'panchayat_officer')
);

CREATE POLICY "Admins can delete assets"
ON public.assets FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for forecasts (public read, system write)
CREATE POLICY "Anyone can view forecasts"
ON public.forecasts FOR SELECT
USING (true);

CREATE POLICY "Service role can manage forecasts"
ON public.forecasts FOR ALL
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_mgnrega_district_date ON public.mgnrega_data(district_id, date DESC);
CREATE INDEX idx_assets_district ON public.assets(district_id, block_name);
CREATE INDEX idx_assets_location ON public.assets(latitude, longitude);
CREATE INDEX idx_forecasts_district ON public.forecasts(district_id, block_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for assets table
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample districts
INSERT INTO public.districts (name, state, blocks) VALUES
('Ranchi', 'Jharkhand', '["Ranchi", "Kanke", "Namkum", "Bundu", "Ratu"]'::jsonb),
('Hazaribagh', 'Jharkhand', '["Hazaribagh", "Barhi", "Churchu", "Ichak", "Katkamsandi"]'::jsonb),
('Dumka', 'Jharkhand', '["Dumka", "Jama", "Jarmundi", "Masalia", "Ramgarh"]'::jsonb);

-- Insert sample MGNREGA historical data (last 24 months)
DO $$
DECLARE
    district_rec RECORD;
    block_name TEXT;
    month_date DATE;
    base_person_days INTEGER;
BEGIN
    FOR district_rec IN SELECT id, blocks FROM public.districts LOOP
        FOR block_name IN SELECT jsonb_array_elements_text(district_rec.blocks) LOOP
            base_person_days := 5000 + (random() * 3000)::INTEGER;
            
            FOR i IN 0..23 LOOP
                month_date := date_trunc('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
                
                INSERT INTO public.mgnrega_data (district_id, block_name, date, person_days, households_worked)
                VALUES (
                    district_rec.id,
                    block_name,
                    month_date,
                    base_person_days + (random() * 2000 - 1000)::INTEGER + 
                        CASE WHEN EXTRACT(MONTH FROM month_date) IN (6,7,8) THEN 1500 ELSE 0 END,
                    (base_person_days / 25) + (random() * 100)::INTEGER
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;