-- Crear tabla de recibos
CREATE TABLE IF NOT EXISTS `tbl_order_recibo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `num_rec` varchar(50) NOT NULL,
  `cliente` varchar(50) DEFAULT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `vendedor` varchar(100) DEFAULT NULL,
  `total` decimal(14,2) DEFAULT 0.00,
  `detalles` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Datos de ejemplo
INSERT INTO tbl_order_recibo (num_rec, cliente, nombre, fecha, vendedor, total) VALUES
('REC-001', 'CLI-001', 'Juan Perez Garcia', '2026-06-01', 'V001', 1500.00),
('REC-002', 'CLI-002', 'Maria Lopez Torres', '2026-06-02', 'V002', 3200.50),
('REC-003', 'CLI-003', 'Carlos Mendoza Rios', '2026-06-03', 'V001', 850.00),
('REC-004', 'CLI-004', 'Ana Castillo Vargas', '2026-06-04', 'V003', 2100.00),
('REC-005', 'CLI-005', 'Pedro Silva Huaman', '2026-06-05', 'V002', 5600.00),
('REC-006', 'CLI-006', 'Lucia Fernandez Diaz', '2026-06-06', 'V001', 980.00),
('REC-007', 'CLI-007', 'Jorge Ramirez Paredes', '2026-06-07', 'V003', 4300.00),
('REC-008', 'CLI-008', 'Rosa Castro Morales', '2026-06-08', 'V002', 7200.00),
('REC-009', 'CLI-009', 'Miguel Torres Guzman', '2026-06-09', 'V001', 3100.00),
('REC-010', 'CLI-010', 'Diana Pizarro Rojas', '2026-06-10', 'V003', 1900.00);
