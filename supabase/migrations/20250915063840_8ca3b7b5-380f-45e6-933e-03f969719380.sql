-- Create sample shifts
INSERT INTO shifts (id, event_id, date, start_time, end_time, required_operators, activity_type, notes)
VALUES 
  ('s1', 'e1', '2025-01-20', '08:00', '16:00', 2, 'presido diurno', 'Turno diurno controllo accessi'),
  ('s2', 'e1', '2025-01-20', '16:00', '00:00', 2, 'presidio notturno', 'Turno serale controllo perimetro'),
  ('s3', 'e2', '2025-01-25', '22:00', '06:00', 1, 'presidio notturno e diurno', 'Ronda notturna')
ON CONFLICT (id) DO NOTHING;

-- Create sample shift assignments (check existing first)
INSERT INTO shift_assignments (shift_id, operator_id, slot_index)
SELECT 's1', 'o1', 1
WHERE NOT EXISTS (SELECT 1 FROM shift_assignments WHERE shift_id = 's1' AND operator_id = 'o1');

INSERT INTO shift_assignments (shift_id, operator_id, slot_index)
SELECT 's1', 'o2', 2
WHERE NOT EXISTS (SELECT 1 FROM shift_assignments WHERE shift_id = 's1' AND operator_id = 'o2');

INSERT INTO shift_assignments (shift_id, operator_id, slot_index)
SELECT 's2', 'o3', 1
WHERE NOT EXISTS (SELECT 1 FROM shift_assignments WHERE shift_id = 's2' AND operator_id = 'o3');

INSERT INTO shift_assignments (shift_id, operator_id, slot_index)
SELECT 's3', 'o1', 1
WHERE NOT EXISTS (SELECT 1 FROM shift_assignments WHERE shift_id = 's3' AND operator_id = 'o1');