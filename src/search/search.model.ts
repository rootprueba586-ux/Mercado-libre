// Validación de la consulta de búsqueda (filtros + texto libre).
import { z } from 'zod';
import { PartCategory } from '../parts/part.model.ts';

const emptyToNull = (value: unknown) =>
  value === '' || value === null || value === undefined ? null : value;

const OptionalPrice = z.preprocess(
  emptyToNull,
  z.coerce.number().nonnegative('El precio debe ser un número ≥ 0').nullable(),
);

export const SearchQuery = z
  .object({
    q: z.string().trim().max(200).default(''),
    brand: z.string().trim().max(80).default(''),
    category: z.union([PartCategory, z.literal('')]).default(''),
    priceMin: OptionalPrice,
    priceMax: OptionalPrice,
  })
  .superRefine((value, ctx) => {
    if (value.priceMin !== null && value.priceMax !== null && value.priceMin > value.priceMax) {
      ctx.addIssue({
        code: 'custom',
        message: 'El mínimo del precio no puede pasar el máximo',
        path: ['priceMin'],
      });
    }
  });

export type SearchQuery = z.infer<typeof SearchQuery>;

export type SearchResultItem = {
  id: number;
  title: string;
  brand: string;
  category: string;
  sku: string;
  price: number | null;
  imageUrl: string;
  viscosity: string;
  base: string;
  score: number;
};

export type SearchResponse = {
  query: SearchQuery;
  results: SearchResultItem[];
  notImplemented: boolean;
  message?: string;
};
