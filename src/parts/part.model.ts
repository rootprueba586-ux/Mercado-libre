// Modelo del catálogo de repuestos: tipos y validación Zod (API + frontend).
import { z } from 'zod';

/** Categorías del marketplace (CHECK en la migración 002). */
export const PartCategory = z.enum([
  'brakes',
  'filters',
  'engine',
  'electrical',
  'suspension',
  'body',
  'other',
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
  createdAt: string;
};
