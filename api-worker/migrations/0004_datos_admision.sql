-- Datos adicionales de la ficha 2027. Los registros anteriores conservan NULL.
-- nombre_estudiante sigue siendo el nombre completo usado por CRM y Valana.
ALTER TABLE postulaciones ADD COLUMN nombres_estudiante TEXT
  CHECK (nombres_estudiante IS NULL OR length(trim(nombres_estudiante)) BETWEEN 2 AND 50);
ALTER TABLE postulaciones ADD COLUMN apellido_paterno_estudiante TEXT
  CHECK (apellido_paterno_estudiante IS NULL OR length(trim(apellido_paterno_estudiante)) BETWEEN 2 AND 40);
ALTER TABLE postulaciones ADD COLUMN apellido_materno_estudiante TEXT
  CHECK (apellido_materno_estudiante IS NULL OR length(trim(apellido_materno_estudiante)) BETWEEN 2 AND 40);
ALTER TABLE postulaciones ADD COLUMN institucion_procedencia TEXT
  CHECK (institucion_procedencia IS NULL OR length(trim(institucion_procedencia)) BETWEEN 2 AND 150);
ALTER TABLE postulaciones ADD COLUMN parentesco_apoderado TEXT
  CHECK (parentesco_apoderado IS NULL OR length(trim(parentesco_apoderado)) BETWEEN 2 AND 60);
