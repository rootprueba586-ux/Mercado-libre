// Modelo del catálogo: mismas categorías y campos de ficha que Aceite/laboratorio/busqueda.
import { z } from 'zod';

/** Categorías exactas del catálogo Aceite (products.json). */
export const PartCategory = z.enum([
  'Lubricantes',
  'Filtros',
  'Refrigerante',
  'Frenos',
  'Aditivos',
  'Motor',
  'Encendido',
  'Eléctrico',
  'Herramientas',
]);

export type PartCategory = z.infer<typeof PartCategory>;

/** Lo que el cliente envía para crear o editar un repuesto. */
export const PartInput = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  brand: z.string().trim().min(1, 'La marca es obligatoria').max(80, 'Máximo 80 caracteres'),
  category: PartCategory,
  sku: z.string().trim().max(80).default(''),
  price: z.number().nonnegative('El precio no puede ser negativo').nullable().default(null),
  imageUrl: z.string().trim().max(500).default(''),
  viscosity: z.string().trim().max(40).default(''),
  base: z.string().trim().max(40).default(''),
  externalId: z.string().trim().max(80).nullable().default(null),
});

export type PartInput = z.infer<typeof PartInput>;

/** Lo que la API devuelve. */
export type Part = {
  id: number;
  title: string;
  brand: string;
  category: PartCategory;
  sku: string;
  price: number | null;
  imageUrl: string;
  viscosity: string;
  base: string;
  externalId: string | null;
  createdAt: string;
};
