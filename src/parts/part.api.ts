// Llamadas del frontend a la API de repuestos.
import { request } from '../shared/http-client.ts';
import type { Part, PartInput } from './part.model.ts';

export const partApi = {
  list: () => request<Part[]>('/parts'),
  create: (input: PartInput) => request<Part>('/parts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: PartInput) =>
    request<Part>(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => request<void>(`/parts/${id}`, { method: 'DELETE' }),
};
