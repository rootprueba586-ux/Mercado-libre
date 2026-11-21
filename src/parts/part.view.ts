// Alta rápida de repuestos (admin). Categorías = catálogo Aceite.
import { partApi } from './part.api.ts';
import { PartCategory, type Part } from './part.model.ts';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No existe el elemento #${id}`);
  return element as T;
}

export function startPartView(): void {
  const form = byId<HTMLFormElement>('part-form');
  const titleInput = byId<HTMLInputElement>('part-title');
  const brandInput = byId<HTMLInputElement>('part-brand');
  const categorySelect = byId<HTMLSelectElement>('part-category');
  const priceInput = byId<HTMLInputElement>('part-price');
  const formError = byId<HTMLParagraphElement>('part-form-error');
  const list = byId<HTMLUListElement>('part-list');
  const count = byId<HTMLElement>('part-count');
  const emptyState = byId<HTMLParagraphElement>('part-empty');

  let parts: Part[] = [];

  for (const category of PartCategory.options) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  }

  function render(): void {
    list.replaceChildren(
      ...parts.map((part) => {
        const item = document.createElement('li');
        const price =
          part.price === null ? 'Sin precio' : `$${part.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
        const extra = [part.viscosity, part.base].filter(Boolean).join(' · ');
        item.textContent = `${part.title} · ${part.brand} · ${part.category}${extra ? ` · ${extra}` : ''} · ${price}`;
        return item;
      }),
    );
    count.textContent = String(parts.length);
    emptyState.hidden = parts.length > 0;
  }

  async function load(): Promise<void> {
    parts = await partApi.list();
    render();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';
    try {
      const priceRaw = priceInput.value.trim();
      const created = await partApi.create({
        title: titleInput.value,
        brand: brandInput.value,
        category: PartCategory.parse(categorySelect.value),
        sku: '',
        price: priceRaw === '' ? null : Number(priceRaw),
        imageUrl: '',
        viscosity: '',
        base: '',
        externalId: null,
      });
      parts = [...parts, created].sort((a, b) => a.title.localeCompare(b.title, 'es'));
      form.reset();
      render();
    } catch (error) {
      formError.textContent = error instanceof Error ? error.message : 'No se pudo guardar';
    }
  });

  load().catch(() => {
    formError.textContent = 'No se pudo conectar con la API. ¿Está corriendo `npm run dev`?';
  });
}
