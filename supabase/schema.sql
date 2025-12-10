-- ============================================
-- SUPABASE SCHEMA - ÒRBITA EVENTS
-- Sistema d'Opinions amb Supabase
-- ============================================

-- Taula de Clients
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  phone TEXT,
  phone_normalized TEXT,
  city TEXT,
  instagram TEXT,
  instagram_normalized TEXT,
  preferred_locale TEXT DEFAULT 'es',
  source TEXT DEFAULT 'WEBSITE',
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent_date TIMESTAMPTZ,
  total_events INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índexs per customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_normalized);

-- Taula de Testimonis/Opinions
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  event_type TEXT,
  event_date DATE,
  photo_url TEXT,
  show_name BOOLEAN DEFAULT TRUE,
  show_photo BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  canvas_image_url TEXT,
  canvas_generated_at TIMESTAMPTZ,
  discount_code TEXT,
  discount_percent INTEGER DEFAULT 10,
  submission_token TEXT UNIQUE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índexs per testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_customer ON testimonials(customer_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_created ON testimonials(created_at DESC);

-- Taula d'Activitat de Clients (log)
CREATE TABLE IF NOT EXISTS customer_activities (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índex per activitat
CREATE INDEX IF NOT EXISTS idx_activities_customer ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON customer_activities(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- Política per testimonis aprovats (lectura pública)
CREATE POLICY "Testimonis aprovats són públics" ON testimonials
  FOR SELECT
  USING (is_approved = TRUE);

-- Política per inserir testimonis (qualsevol pot crear)
CREATE POLICY "Qualsevol pot crear testimoni" ON testimonials
  FOR INSERT
  WITH CHECK (TRUE);

-- Política per service role (accés total)
CREATE POLICY "Service role té accés total a customers" ON customers
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role té accés total a testimonials" ON testimonials
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role té accés total a activities" ON customer_activities
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- FUNCIONS ÚTILS
-- ============================================

-- Funció per actualitzar updated_at automàticament
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers per updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
