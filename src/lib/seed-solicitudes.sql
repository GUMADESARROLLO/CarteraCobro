-- Sample solicitudes for testing table layout
-- Run: mysql -h 192.168.1.15 -u root -p db_gumanet < src/lib/seed-solicitudes.sql

INSERT INTO solicitudes (codigo, ruta, cliente, cod_cliente, monto, fecha, estado, motivo, saldo_actual, limite_actual, disponible_actual) VALUES
('SOL-001', 'Ruta Norte', 'Juan Perez Garcia', 'CLI-001', 2500.00, '2026-06-01', 'Pendiente', NULL, 1500.00, 5000.00, 3500.00),
('SOL-002', 'Ruta Sur', 'Maria Lopez Torres', 'CLI-002', 4800.50, '2026-06-02', 'Aprobado', NULL, 0.00, 10000.00, 10000.00),
('SOL-003', 'Ruta Este', 'Carlos Mendoza Rios', 'CLI-003', 1200.00, '2026-06-03', 'Rechazado', 'Documentacion incompleta', 3200.00, 5000.00, 1800.00),
('SOL-004', 'Ruta Norte', 'Ana Castillo Vargas', 'CLI-004', 3100.00, '2026-06-04', 'Pendiente', NULL, 800.00, 6000.00, 5200.00),
('SOL-005', 'Ruta Oeste', 'Pedro Silva Huaman', 'CLI-005', 5600.00, '2026-06-05', 'Aprobado', NULL, 0.00, 8000.00, 8000.00),
('SOL-006', 'Ruta Sur', 'Lucia Fernandez Diaz', 'CLI-006', 980.00, '2026-06-06', 'Pendiente', NULL, 4500.00, 5000.00, 500.00),
('SOL-007', 'Ruta Este', 'Jorge Ramirez Paredes', 'CLI-007', 7000.00, '2026-06-07', 'Aprobado', NULL, 0.00, 12000.00, 12000.00),
('SOL-008', 'Ruta Norte', 'Rosa Castro Morales', 'CLI-008', 2200.00, '2026-06-08', 'Rechazado', 'Cliente no contactable', 2200.00, 4000.00, 1800.00),
('SOL-009', 'Ruta Oeste', 'Miguel Torres Guzman', 'CLI-009', 3500.00, '2026-06-09', 'Pendiente', NULL, 1200.00, 7000.00, 5800.00),
('SOL-010', 'Ruta Sur', 'Diana Pizarro Rojas', 'CLI-010', 4100.00, '2026-06-10', 'Aprobado', NULL, 0.00, 9000.00, 9000.00),
('SOL-011', 'Ruta Norte', 'Alberto Gutierrez Vega', 'CLI-011', 1850.00, '2026-06-11', 'Pendiente', NULL, 2800.00, 5000.00, 2200.00),
('SOL-012', 'Ruta Este', 'Sofia Delgado Acosta', 'CLI-012', 6300.00, '2026-06-12', 'Aprobado', NULL, 0.00, 15000.00, 15000.00),
('SOL-013', 'Ruta Oeste', 'Luis Hernandez Ormeño', 'CLI-013', 2700.00, '2026-06-13', 'Rechazado', 'Credito excede limite', 5000.00, 6000.00, 1000.00),
('SOL-014', 'Ruta Sur', 'Carmen Flores Lozano', 'CLI-014', 3900.00, '2026-06-14', 'Pendiente', NULL, 600.00, 8000.00, 7400.00),
('SOL-015', 'Ruta Norte', 'Ricardo Salazar Nuñez', 'CLI-015', 1500.00, '2026-06-15', 'Aprobado', NULL, 0.00, 3000.00, 3000.00),
('SOL-016', 'Ruta Este', 'Patricia Rios Campos', 'CLI-016', 5200.00, '2026-06-16', 'Pendiente', NULL, 1000.00, 10000.00, 9000.00),
('SOL-017', 'Ruta Oeste', 'Fernando Quispe Mamani', 'CLI-017', 800.00, '2026-06-17', 'Aprobado', NULL, 0.00, 2000.00, 2000.00),
('SOL-018', 'Ruta Sur', 'Gloria Maldonado Chavez', 'CLI-018', 4400.00, '2026-06-18', 'Pendiente', NULL, 3000.00, 8000.00, 5000.00),
('SOL-019', 'Ruta Norte', 'Hector Montero Valencia', 'CLI-019', 6100.00, '2026-06-19', 'Rechazado', 'Cliente con mora', 7500.00, 8000.00, 500.00),
('SOL-020', 'Ruta Este', 'Irene Bravo Salinas', 'CLI-020', 3300.00, '2026-06-20', 'Aprobado', NULL, 0.00, 6000.00, 6000.00),
('SOL-021', 'Ruta Oeste', 'Jose Cordova Vega', 'CLI-021', 2800.00, '2026-06-21', 'Pendiente', NULL, 1500.00, 5000.00, 3500.00),
('SOL-022', 'Ruta Sur', 'Karla Villanueva Ponce', 'CLI-022', 4700.00, '2026-06-22', 'Aprobado', NULL, 0.00, 10000.00, 10000.00),
('SOL-023', 'Ruta Norte', 'Oscar Peña Rojas', 'CLI-023', 1900.00, '2026-06-23', 'Pendiente', NULL, 3600.00, 6000.00, 2400.00),
('SOL-024', 'Ruta Este', 'Ruth Aguirre Luna', 'CLI-024', 5500.00, '2026-06-24', 'Rechazado', 'Sin garantias suficientes', 5500.00, 7000.00, 1500.00),
('SOL-025', 'Ruta Oeste', 'Tomas Velasquez Mori', 'CLI-025', 3800.00, '2026-06-25', 'Aprobado', NULL, 0.00, 8000.00, 8000.00);
