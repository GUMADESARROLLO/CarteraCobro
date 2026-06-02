-- Agregar columna resolucion a solicitudes
ALTER TABLE solicitudes ADD COLUMN `resolucion` varchar(500) DEFAULT NULL AFTER `motivo`;
