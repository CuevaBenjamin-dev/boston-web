-- Solo las filas creadas después de aplicar esta migración entran en Valana.
-- El formulario se conserva en D1 hasta que la entrega sea confirmada.
CREATE TABLE entregas_valana (
  tipo TEXT NOT NULL CHECK (tipo IN ('postulacion','contacto')),
  origen_id INTEGER NOT NULL CHECK (origen_id > 0),
  intentos INTEGER NOT NULL DEFAULT 0,
  siguiente_intento TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entregada_en TEXT,
  ultimo_codigo INTEGER,
  PRIMARY KEY (tipo,origen_id)
);
CREATE INDEX entregas_valana_pendientes ON entregas_valana(entregada_en,siguiente_intento);
CREATE TRIGGER nueva_postulacion_valana AFTER INSERT ON postulaciones BEGIN
  INSERT INTO entregas_valana(tipo,origen_id) VALUES('postulacion',NEW.id);
END;
CREATE TRIGGER nuevo_contacto_valana AFTER INSERT ON contactos_web BEGIN
  INSERT INTO entregas_valana(tipo,origen_id) VALUES('contacto',NEW.id);
END;
