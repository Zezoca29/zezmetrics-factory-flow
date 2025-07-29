-- Adicionar mais máquinas e registros de produção para demonstração

-- Inserir mais máquinas
INSERT INTO public.machines (name, code, sector) VALUES
  ('Fresadora Universal', 'FU-005', 'Produção'),
  ('Prensa Hidráulica', 'PH-006', 'Conformação'),
  ('Centro de Usinagem', 'CU-007', 'Produção'),
  ('Esteira Transportadora', 'ET-008', 'Embalagem'),
  ('Máquina de Solda', 'MS-009', 'Montagem'),
  ('Torno Revólver', 'TR-010', 'Produção');

-- Inserir mais registros de produção para os últimos 30 dias
-- Isso criará dados mais ricos para o dashboard
INSERT INTO public.production_records (machine_id, shift_id, date, planned_production, actual_production, downtime_minutes, defective_units, downtime_reason)
SELECT 
  m.id,
  s.id,
  CURRENT_DATE - INTERVAL '30 days' + (day_offset || ' days')::INTERVAL,
  CASE 
    WHEN m.sector = 'Produção' THEN (900 + (random() * 200)::integer)
    WHEN m.sector = 'Embalagem' THEN (1200 + (random() * 300)::integer)
    WHEN m.sector = 'Conformação' THEN (600 + (random() * 150)::integer)
    ELSE (800 + (random() * 200)::integer)
  END as planned_production,
  CASE 
    WHEN m.sector = 'Produção' THEN (750 + (random() * 180)::integer)
    WHEN m.sector = 'Embalagem' THEN (1000 + (random() * 280)::integer)
    WHEN m.sector = 'Conformação' THEN (500 + (random() * 140)::integer)
    ELSE (700 + (random() * 180)::integer)
  END as actual_production,
  (15 + (random() * 90)::integer) as downtime_minutes,
  (0 + (random() * 20)::integer) as defective_units,
  CASE 
    WHEN random() < 0.2 THEN 'Manutenção preventiva'
    WHEN random() < 0.4 THEN 'Troca de ferramentas'
    WHEN random() < 0.6 THEN 'Ajuste de parâmetros'
    WHEN random() < 0.8 THEN 'Limpeza programada'
    ELSE 'Mudança de produto'
  END as downtime_reason
FROM public.machines m
CROSS JOIN public.shifts s
CROSS JOIN generate_series(0, 29) AS day_offset
WHERE random() > 0.1; -- 90% chance de ter registro para cada dia/máquina/turno

-- Inserir alguns registros específicos de hoje para demonstração imediata
INSERT INTO public.production_records (machine_id, shift_id, date, planned_production, actual_production, downtime_minutes, defective_units, downtime_reason)
SELECT 
  m.id,
  s.id,
  CURRENT_DATE,
  CASE 
    WHEN m.sector = 'Produção' THEN 900
    WHEN m.sector = 'Embalagem' THEN 1200
    ELSE 800
  END,
  CASE 
    WHEN m.sector = 'Produção' THEN 850
    WHEN m.sector = 'Embalagem' THEN 1150
    ELSE 750
  END,
  CASE 
    WHEN m.name LIKE '%A' THEN 30
    WHEN m.name LIKE '%B' THEN 60
    ELSE 15
  END,
  CASE 
    WHEN m.name LIKE '%A' THEN 5
    WHEN m.name LIKE '%B' THEN 12
    ELSE 3
  END,
  CASE 
    WHEN m.name LIKE '%A' THEN 'Ajuste de qualidade'
    WHEN m.name LIKE '%B' THEN 'Troca de matéria-prima'
    ELSE 'Operação normal'
  END
FROM public.machines m
CROSS JOIN public.shifts s
WHERE s.name = 'Manhã'
LIMIT 6;