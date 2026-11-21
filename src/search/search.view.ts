// Pantalla de búsqueda: filtros siempre; texto q avisa hasta que exista el índice a mano.
import { PartCategory } from '../parts/part.model.ts';
import { searchApi } from './search.api.ts';
import type { SearchResultItem } from './search.model.ts';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No existe el elemento #${id}`);
  return element as T;
}

export function startSearchView(): void {
  const form = byId<HTMLFormElement>('search-form');
  const qInput = byId<HTMLInputElement>('search-q');
  const brandInput = byId<HTMLInputElement>('search-brand');
  const categorySelect = byId<HTMLSelectElement>('search-category');
  const priceMinInput = byId<HTMLInputElement>('search-price-min');
  const priceMaxInput = byId<HTMLInputElement>('search-price-max');
  const formError = byId<HTMLParagraphElement>('search-form-error');
  const list = byId<HTMLUListElement>('search-results');
  const count = byId<HTMLSpanElement>('search-count');
  const emptyState = byId<HTMLParagraphElement>('search-empty');
  const notice = byId<HTMLParagraphElement>('search-notice');

  const anyOption = document.createElement('option');
  anyOption.value = '';
  anyOption.textContent = 'Todas';
  categorySelect.append(anyOption);
  for (const category of PartCategory.options) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  }

  function render(results: SearchResultItem[]): void {
    list.replaceChildren(
      ...results.map((item) => {
        const li = document.createElement('li');
        const price =
          item.price === null ? 'Sin precio' : `$${item.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
        li.textContent = `${item.title} · ${item.brand} · ${item.category} · ${price}`;
        return li;
      }),
    );
    count.textContent = `(${results.length})`;
    emptyState.hidden = results.length > 0;
  }

  async function runSearch(): Promise<void> {
    formError.textContent = '';
    notice.textContent = '';
    const priceMinRaw = priceMinInput.value.trim();
    const priceMaxRaw = priceMaxInput.value.trim();
    const response = await searchApi.search({
      q: qInput.value,
      brand: brandInput.value,
      category: categorySelect.value === '' ? '' : PartCategory.parse(categorySelect.value),
      priceMin: priceMinRaw === '' ? null : Number(priceMinRaw),
      priceMax: priceMaxRaw === '' ? null : Number(priceMaxRaw),
    });
    if (response.notImplemented) {
      notice.textContent = response.message ?? 'Búsqueda por texto pendiente (índice invertido).';
    }
    render(response.results);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runSearch().catch((error: unknown) => {
      formError.textContent = error instanceof Error ? error.message : 'No se pudo buscar';
    });
  });

  runSearch().catch(() => {
    formError.textContent = 'No se pudo conectar con la API. ¿Está corriendo `npm run dev`?';
  });
}
