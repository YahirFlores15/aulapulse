INSERT INTO referral_reason_catalog (code, name, is_active)
VALUES
  ('ACADEMIC_RISK', 'Riesgo académico', 1),
  ('ATTENDANCE', 'Inasistencia', 1),
  ('BEHAVIOR', 'Conducta', 1),
  ('EMOTIONAL', 'Situación emocional', 1),
  ('FAMILY', 'Situación familiar', 1)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  is_active = excluded.is_active;