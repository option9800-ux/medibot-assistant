-- Shared updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ MEDICATIONS ============
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  times TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "med_select_own" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "med_insert_own" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "med_update_own" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "med_delete_own" ON public.medications FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_medications_user ON public.medications(user_id);

-- ============ VITALS ============
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- blood_pressure | heart_rate | blood_sugar | weight | temperature | oxygen
  value_numeric NUMERIC,
  value_secondary NUMERIC, -- e.g. diastolic for BP
  unit TEXT,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vit_select_own" ON public.vitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vit_insert_own" ON public.vitals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vit_update_own" ON public.vitals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vit_delete_own" ON public.vitals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_vitals_user_time ON public.vitals(user_id, recorded_at DESC);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  doctor_name TEXT,
  specialty TEXT,
  location TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | completed | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_select_own" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appt_insert_own" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appt_update_own" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "appt_delete_own" ON public.appointments FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_appointments_user_time ON public.appointments(user_id, scheduled_at);

-- ============ EMERGENCY CONTACTS ============
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_select_own" ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ec_insert_own" ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ec_update_own" ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ec_delete_own" ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_emergency_contacts_updated_at BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_emergency_contacts_user ON public.emergency_contacts(user_id);