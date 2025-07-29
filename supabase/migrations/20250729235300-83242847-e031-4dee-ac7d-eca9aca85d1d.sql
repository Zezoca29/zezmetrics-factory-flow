-- ZezMetrics Database Schema
-- Criação das tabelas para monitoramento de OEE

-- Tabela de Máquinas
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Turnos
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Registros de Produção
CREATE TABLE public.production_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES public.machines(id),
  shift_id UUID NOT NULL REFERENCES public.shifts(id),
  date DATE NOT NULL,
  planned_production INTEGER NOT NULL,
  actual_production INTEGER NOT NULL,
  downtime_minutes INTEGER NOT NULL DEFAULT 0,
  downtime_reason TEXT,
  defective_units INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

-- Policies for public access (MVP sem autenticação)
CREATE POLICY "Permitir acesso público a máquinas" 
ON public.machines FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a turnos" 
ON public.shifts FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a registros de produção" 
ON public.production_records FOR ALL USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_records_updated_at
  BEFORE UPDATE ON public.production_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.shifts (name, start_time, end_time) VALUES
  ('Manhã', '06:00:00', '14:00:00'),
  ('Tarde', '14:00:00', '22:00:00'),
  ('Noite', '22:00:00', '06:00:00');

INSERT INTO public.machines (name, code, sector) VALUES
  ('Máquina A', 'MA-001', 'Produção'),
  ('Máquina B', 'MB-002', 'Produção'),
  ('Máquina C', 'MC-003', 'Embalagem'),
  ('Máquina D', 'MD-004', 'Qualidade');

-- Inserir registros de produção de exemplo (última semana)
INSERT INTO public.production_records (machine_id, shift_id, date, planned_production, actual_production, downtime_minutes, defective_units, downtime_reason)
SELECT 
  m.id,
  s.id,
  CURRENT_DATE - INTERVAL '7 days' + (generate_series(0, 6) || ' days')::INTERVAL,
  (800 + (random() * 200)::integer),
  (700 + (random() * 180)::integer),
  (30 + (random() * 120)::integer),
  (5 + (random() * 15)::integer),
  CASE 
    WHEN random() < 0.3 THEN 'Manutenção preventiva'
    WHEN random() < 0.6 THEN 'Troca de ferramentas'
    ELSE 'Ajuste de parâmetros'
  END
FROM public.machines m
CROSS JOIN public.shifts s
WHERE s.name = 'Manhã';