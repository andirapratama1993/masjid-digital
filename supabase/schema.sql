-- =============================================
-- MASJID DIGITAL - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: settings (general mosque settings)
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('mosque_name', 'Masjid Al-Ikhlas'),
  ('mosque_logo_url', ''),
  ('city_id', '1301'),
  ('city_name', 'Jakarta'),
  ('clock_color', '#10B981'),
  ('prayer_time_color', '#F59E0B'),
  ('display_duration', '30'),
  ('activity_table_duration', '20'),
  ('activity_detail_duration', '10'),
  ('azan_duration', '180'),
  ('iqomah_duration', '600'),
  ('prayer_notification_minutes', '5')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- TABLE: activities (mosque weekly activities)
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  title TEXT NOT NULL,
  description TEXT,
  time_start TEXT,
  time_end TEXT,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default activities
INSERT INTO activities (day_of_week, title, description, time_start, time_end, location, sort_order) VALUES
  (0, 'Kajian Ahad Pagi', 'Kajian rutin setiap minggu pagi bersama ustadz', '07:00', '09:00', 'Masjid Utama', 0),
  (1, 'Pengajian Ibu-ibu', 'Majelis taklim ibu-ibu setiap senin', '09:00', '11:00', 'Aula Masjid', 1),
  (2, 'Tahsin Al-Quran', 'Belajar membaca Al-Quran dengan tartil', '18:30', '20:00', 'Masjid Utama', 2),
  (3, 'Kajian Hadits', 'Kajian kitab hadits bersama ustadz', '18:30', '20:00', 'Masjid Utama', 3),
  (4, 'Remaja Masjid', 'Kegiatan pemuda dan remaja masjid', '16:00', '17:30', 'Halaman Masjid', 4),
  (5, 'Kajian Jumat', 'Kajian intensif menyambut Jumat', '13:30', '15:00', 'Masjid Utama', 5),
  (6, 'Gotong Royong', 'Bersih-bersih masjid dan lingkungan', '07:00', '09:00', 'Seluruh Area Masjid', 6)
ON CONFLICT DO NOTHING;

-- =============================================
-- TABLE: finances (mosque financial records)
-- =============================================
CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount BIGINT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample financial data
INSERT INTO finances (type, amount, description, category, transaction_date) VALUES
  ('income', 2500000, 'Infaq Jumat', 'Infaq', CURRENT_DATE - INTERVAL '1 day'),
  ('income', 1500000, 'Donasi Renovasi', 'Donasi', CURRENT_DATE - INTERVAL '2 days'),
  ('expense', 500000, 'Listrik Bulan Ini', 'Operasional', CURRENT_DATE - INTERVAL '3 days'),
  ('income', 3000000, 'Infaq Jumat', 'Infaq', CURRENT_DATE - INTERVAL '8 days'),
  ('expense', 750000, 'Kebersihan', 'Operasional', CURRENT_DATE - INTERVAL '10 days'),
  ('income', 1200000, 'Donasi Rutin', 'Donasi', CURRENT_DATE - INTERVAL '12 days'),
  ('expense', 300000, 'ATK & Perlengkapan', 'Operasional', CURRENT_DATE - INTERVAL '14 days'),
  ('income', 2800000, 'Infaq Jumat', 'Infaq', CURRENT_DATE - INTERVAL '15 days'),
  ('expense', 1000000, 'Honor Imam', 'Personalia', CURRENT_DATE - INTERVAL '20 days'),
  ('income', 4500000, 'Zakat Maal', 'Zakat', CURRENT_DATE - INTERVAL '22 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- TABLE: finance_summary (stored for display)
-- =============================================
CREATE TABLE IF NOT EXISTS finance_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finance_summary (last_updated, opening_balance) VALUES
  (CURRENT_DATE, 15000000)
ON CONFLICT DO NOTHING;

-- =============================================
-- Storage buckets (run separately in Supabase dashboard or via API)
-- =============================================
-- Bucket: mosque-assets (for mosque logo)
-- Bucket: activity-images (for activity photos)

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_summary ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for display page)
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Allow public read finances" ON finances FOR SELECT USING (true);
CREATE POLICY "Allow public read finance_summary" ON finance_summary FOR SELECT USING (true);

-- Allow service role full access (for API routes with service role key)
CREATE POLICY "Allow service role all settings" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all activities" ON activities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all finances" ON finances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all finance_summary" ON finance_summary FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- Functions & Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON finances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_summary_updated_at BEFORE UPDATE ON finance_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
