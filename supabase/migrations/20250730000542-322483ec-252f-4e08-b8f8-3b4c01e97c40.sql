-- Habilitar realtime updates para o dashboard
-- Configura REPLICA IDENTITY FULL para capturar dados completos durante updates

ALTER TABLE public.production_records REPLICA IDENTITY FULL;
ALTER TABLE public.machines REPLICA IDENTITY FULL;
ALTER TABLE public.shifts REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;