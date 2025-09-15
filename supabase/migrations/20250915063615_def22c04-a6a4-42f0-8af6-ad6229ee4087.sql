-- Promote one user to admin role
UPDATE profiles 
SET role = 'admin'::user_role 
WHERE id = 'e76ac26e-c733-4a79-841b-5aafad581cf7';

-- Link users to operators based on email matching
UPDATE profiles 
SET operator_id = 'o1' 
WHERE id = 'e76ac26e-c733-4a79-841b-5aafad581cf7';

UPDATE profiles 
SET operator_id = 'o2' 
WHERE id = '9310598d-e39d-4f9e-8872-1f0460fa41b7';

UPDATE profiles 
SET operator_id = 'o3' 
WHERE id = '3e367a0f-2e0e-4312-870e-9d7ef4c34554';

UPDATE profiles 
SET operator_id = 'o4' 
WHERE id = 'a785dfa1-7c33-4dd8-8799-96b41ed76423';

-- Create sample client
INSERT INTO clients (id, name, vat_number) 
VALUES ('c1', 'Centro Commerciale Milano', '12345678901')
ON CONFLICT (id) DO NOTHING;

-- Create sample brand  
INSERT INTO brands (id, name, client_id)
VALUES ('b1', 'Security Plus', 'c1')
ON CONFLICT (id) DO NOTHING;

-- Create sample events
INSERT INTO events (id, title, client_id, brand_id, address, start_date, end_date, notes)
VALUES 
  ('e1', 'Evento Sicurezza Centro Commerciale', 'c1', 'b1', 'Via Milano 123, Milano', '2025-01-20', '2025-01-22', 'Evento di sicurezza per inaugurazione nuova ala'),
  ('e2', 'Servizio Vigilanza Notturna', 'c1', 'b1', 'Via Roma 456, Milano', '2025-01-25', '2025-01-27', 'Vigilanza notturna per evento speciale')
ON CONFLICT (id) DO NOTHING;

-- Create sample shifts
INSERT INTO shifts (id, event_id, date, start_time, end_time, required_operators, activity_type, notes)
VALUES 
  ('s1', 'e1', '2025-01-20', '08:00', '16:00', 2, 'Vigilanza', 'Turno diurno controllo accessi'),
  ('s2', 'e1', '2025-01-20', '16:00', '00:00', 2, 'Vigilanza', 'Turno serale controllo perimetro'),
  ('s3', 'e2', '2025-01-25', '22:00', '06:00', 1, 'Ronda', 'Ronda notturna')
ON CONFLICT (id) DO NOTHING;

-- Create sample shift assignments
INSERT INTO shift_assignments (shift_id, operator_id, slot_index)
VALUES 
  ('s1', 'o1', 1),
  ('s1', 'o2', 2),
  ('s2', 'o3', 1),
  ('s2', 'o4', 2),
  ('s3', 'o1', 1)
ON CONFLICT (id) DO NOTHING;