-- Migración 003 · Alinear catálogo con Aceite (categorías + viscosidad/base).
-- Limpia filas del seed anterior (categorías en inglés) para poder aplicar el CHECK nuevo.

ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_category_check;

TRUNCATE search_terms, parts RESTART IDENTITY;

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS viscosity text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS base text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_id text;

ALTER TABLE parts
  ADD CONSTRAINT parts_category_check CHECK (category IN (
    'Lubricantes',
    'Filtros',
    'Refrigerante',
    'Frenos',
    'Aditivos',
    'Motor',
    'Encendido',
    'Eléctrico',
    'Herramientas'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_external_id ON parts (external_id)
  WHERE external_id IS NOT NULL;
