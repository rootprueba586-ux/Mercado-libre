// Cliente HTTP de la búsqueda.
import { request } from '../shared/http-client.ts';
import type { SearchQuery, SearchResponse } from './search.model.ts';

export const searchApi = {
  search: (query: Partial<SearchQuery>) => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.brand) params.set('brand', query.brand);
    if (query.category) params.set('category', query.category);
    if (query.priceMin !== null && query.priceMin !== undefined) {
      params.set('priceMin', String(query.priceMin));
    }
    if (query.priceMax !== null && query.priceMax !== undefined) {
      params.set('priceMax', String(query.priceMax));
    }
    const qs = params.toString();
    return request<SearchResponse>(`/search${qs ? `?${qs}` : ''}`);
  },
};
