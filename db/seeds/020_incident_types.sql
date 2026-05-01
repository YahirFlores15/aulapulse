INSERT INTO incident_types (code, name, is_active)
VALUES
  ('TAREA', 'Incumplimiento de tarea', 1),
  ('CONDUCTA', 'Conducta inapropiada', 1),
  ('RESPETO', 'Falta de respeto', 1),
  ('AGRESION', 'Agresión', 1)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  is_active = excluded.is_active;