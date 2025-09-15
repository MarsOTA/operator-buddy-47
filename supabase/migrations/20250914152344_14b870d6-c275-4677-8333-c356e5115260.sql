-- Populate initial data from the existing store

-- Insert initial clients
INSERT INTO public.clients (id, name, vat_number) VALUES
('c1', 'Alfa Group', '12345678901'),
('c2', 'Beta S.p.A.', '09876543210'),
('c3', 'Gamma SRL', '11223344556')
ON CONFLICT (id) DO NOTHING;

-- Insert contact persons
INSERT INTO public.contact_persons (id, client_id, name, email, phone) VALUES
('cp1', 'c1', 'Mario Rossi', 'mario.rossi@alfagroup.it', '333-1234567'),
('cp2', 'c2', 'Laura Bianchi', 'laura.bianchi@beta.it', '339-9876543')
ON CONFLICT (id) DO NOTHING;

-- Insert initial brands
INSERT INTO public.brands (id, name, client_id) VALUES
('b1', 'BrandX', 'c1'),
('b2', 'BrandY', 'c2'),
('b3', 'BrandZ', 'c1')
ON CONFLICT (id) DO NOTHING;

-- Insert brand addresses
INSERT INTO public.brand_addresses (id, brand_id, address) VALUES
('ba1', 'b1', 'Via Roma 1, Milano'),
('ba2', 'b1', 'Corso Buenos Aires 15, Milano'),
('ba3', 'b2', 'Via Torino 25, Torino'),
('ba4', 'b3', 'Piazza Duomo 3, Milano')
ON CONFLICT (id) DO NOTHING;

-- Insert initial operators
INSERT INTO public.operators (id, name, role, availability, phone, email, fiscal_code, photo) VALUES
('o1', 'Mario Rossi', 'Guardia', 'Disponibile', '333-1234567', 'mario.rossi@security.it', 'RSSMRA80A01H501X', '/placeholder.svg'),
('o2', 'Luca Bianchi', 'Supervisore', 'Disponibile', '335-9876543', 'luca.bianchi@security.it', 'BNCLCU75B15F205Y', '/placeholder.svg'),
('o3', 'Anna Verdi', 'Guardia', 'Occupato', '340-1122334', 'anna.verdi@security.it', 'VRDNNA85C55H501Z', '/placeholder.svg'),
('o4', 'Sara Neri', 'Addetto Accoglienza', 'Disponibile', '338-5566778', 'sara.neri@security.it', 'NRESRA90D45H501W', '/placeholder.svg')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification preferences for all operators
INSERT INTO public.notification_preferences (operator_id, shift_assignment, shift_updates, shift_cancellation) VALUES
('o1', true, true, true),
('o2', true, true, true),
('o3', true, true, true),
('o4', true, true, true)
ON CONFLICT (operator_id) DO NOTHING;