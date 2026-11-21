-- Migración 002 · Catálogo de repuestos + índice invertido (H9.1).
-- Diseño inspirado en Aceite/laboratorio/busqueda (producto + termino),
-- adaptado a PostgreSQL. No editar 001_init.sql.

CREATE TABLE parts (
  id          integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       text          NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  brand       text          NOT NULL CHECK (char_length(brand) BETWEEN 1 AND 80),
  category    text          NOT NULL CHECK (category IN (
                  'brakes', 'filters', 'engine', 'electrical',
                  'suspension', 'body', 'other'
                )),
  sku         text          NOT NULL DEFAULT '',
  price       numeric(12, 2),
  image_url   text          NOT NULL DEFAULT '',
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE search_terms (
  term        text          NOT NULL,
  part_id     integer       NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  field       text          NOT NULL CHECK (field IN (
                  'title', 'brand', 'category', 'sku', 'tag'
                )),
  PRIMARY KEY (term, part_id, field)
);

CREATE INDEX idx_search_terms_term ON search_terms (term);
CREATE INDEX idx_parts_brand ON parts (brand);
CREATE INDEX idx_parts_category ON parts (category);
CREATE INDEX idx_parts_price ON parts (price);
