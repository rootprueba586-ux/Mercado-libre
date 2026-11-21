// UI de búsqueda inspirada en Aceite/laboratorio/busqueda, conectada a /api/search.
import { partApi } from '../parts/part.api.ts';
import { PartCategory } from '../parts/part.model.ts';
import { searchApi } from './search.api.ts';
import type { SearchResultItem } from './search.model.ts';

const POPULAR_CHIPS = [
  { label: 'Todos', q: '' },
  { label: 'Lubricantes', q: '', category: 'Lubricantes' },
  { label: 'Filtros', q: '', category: 'Filtros' },
  { label: 'Frenos', q: '', category: 'Frenos' },
  { label: 'Motul', q: '', brand: 'Motul' },
  { label: 'Shell', q: '', brand: 'Shell' },
];

const usd = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No existe el elemento #${id}`);
  return element as T;
}

function initials(brand: string): string {
  const words = brand.split(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]+/).filter(Boolean);
  const raw = words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? '?').slice(0, 2);
  return raw.toUpperCase();
}

function money(value: number | null): string {
  return value === null ? '—' : usd.format(value);
}

function closeMenus(): void {
  document.querySelectorAll('.menu').forEach((menu) => {
    menu.classList.remove('is-open');
    menu.querySelector('.menu__button')?.setAttribute('aria-expanded', 'false');
    const list = menu.querySelector('.menu__list');
    if (list) (list as HTMLElement).hidden = true;
  });
}

function setupMenu(
  menu: HTMLElement,
  list: HTMLElement,
  label: HTMLElement,
  onChange: () => void,
): void {
  const button = menu.querySelector('.menu__button');
  if (!(button instanceof HTMLButtonElement)) return;

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = !menu.classList.contains('is-open');
    closeMenus();
    if (!open) return;
    menu.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    list.hidden = false;
  });

  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const value = target.dataset.value ?? '';
    menu.dataset.value = value;
    label.textContent = target.textContent ?? 'Todas';
    list.querySelectorAll('button').forEach((item) => item.classList.toggle('is-on', item === target));
    closeMenus();
    onChange();
  });
}

function fillMenuList(
  list: HTMLElement,
  entries: { value: string; label: string }[],
  selected: string,
): void {
  list.replaceChildren(
    ...entries.map((entry) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = entry.value;
      button.textContent = entry.label;
      if (entry.value === selected) button.classList.add('is-on');
      li.append(button);
      return li;
    }),
  );
}

function specsFor(item: SearchResultItem): [string, string][] {
  const pairs: [string, string][] = [];
  if (item.viscosity) pairs.push(['Viscosidad', item.viscosity]);
  if (item.base) pairs.push(['Base', item.base]);
  pairs.push(['Categoría', item.category]);
  pairs.push(['SKU', item.sku || '—']);
  return pairs.slice(0, 4);
}

function cardFor(item: SearchResultItem): HTMLElement {
  const article = document.createElement('article');
  article.className = 'product-card';

  const visual = document.createElement('div');
  visual.className = 'product-card__visual';
  const glow = document.createElement('div');
  glow.className = 'product-card__glow';
  visual.append(glow);

  if (item.imageUrl) {
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title;
    visual.append(img);
  } else {
    const logo = document.createElement('span');
    logo.className = 'product-card__logo';
    logo.textContent = initials(item.brand);
    visual.append(logo);
  }

  const tag = document.createElement('span');
  tag.className = 'product-card__tag';
  tag.textContent = item.category;
  visual.append(tag);

  const ticket = document.createElement('span');
  ticket.className = item.price === null ? 'price-ticket price-ticket--empty' : 'price-ticket';
  const priceStrong = document.createElement('b');
  priceStrong.textContent = money(item.price);
  const priceSmall = document.createElement('small');
  priceSmall.append('USD', document.createElement('br'), 'unidad');
  ticket.append(priceStrong, priceSmall);
  visual.append(ticket);

  const body = document.createElement('div');
  body.className = 'product-card__body';

  const idRow = document.createElement('div');
  idRow.className = 'product-card__id';
  const brand = document.createElement('p');
  brand.className = 'product-card__brand';
  brand.textContent = item.brand;
  const sku = document.createElement('span');
  sku.className = 'product-card__sku';
  sku.textContent = item.sku || `ID ${item.id}`;
  idRow.append(brand, sku);

  const title = document.createElement('h3');
  title.textContent = item.title;

  const specs = document.createElement('dl');
  specs.className = 'product-card__specs';
  for (const [dtText, ddText] of specsFor(item)) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = dtText;
    const dd = document.createElement('dd');
    dd.textContent = ddText;
    wrap.append(dt, dd);
    specs.append(wrap);
  }

  const open = document.createElement('div');
  open.className = 'product-card__open';
  open.append(document.createTextNode('Ver ficha'));
  const arrow = document.createElement('span');
  arrow.textContent = '→';
  open.append(arrow);

  body.append(idRow, title, specs, open);
  article.append(visual, body);
  return article;
}

export function startSearchView(): void {
  const form = byId<HTMLFormElement>('search-form');
  const qInput = byId<HTMLInputElement>('search-q');
  const clearButton = byId<HTMLButtonElement>('search-clear');
  const priceMinInput = byId<HTMLInputElement>('search-price-min');
  const priceMaxInput = byId<HTMLInputElement>('search-price-max');
  const formError = byId<HTMLParagraphElement>('search-form-error');
  const notice = byId<HTMLParagraphElement>('search-notice');
  const grid = byId<HTMLDivElement>('search-grid');
  const count = byId<HTMLParagraphElement>('search-count');
  const emptyState = byId<HTMLDivElement>('search-empty');
  const emptyTerm = byId<HTMLSpanElement>('empty-term');
  const emptyText = byId<HTMLParagraphElement>('empty-text');
  const emptyReset = byId<HTMLButtonElement>('empty-reset');
  const chips = byId<HTMLDivElement>('search-chips');
  const categoryMenu = byId<HTMLDivElement>('menu-category');
  const categoryList = byId<HTMLUListElement>('menu-category-list');
  const categoryLabel = byId<HTMLSpanElement>('menu-category-label');
  const brandMenu = byId<HTMLDivElement>('menu-brand');
  const brandList = byId<HTMLUListElement>('menu-brand-list');
  const brandLabel = byId<HTMLSpanElement>('menu-brand-label');

  fillMenuList(
    categoryList,
    [
      { value: '', label: 'Todas' },
      ...PartCategory.options.map((value) => ({ value, label: value })),
    ],
    '',
  );
  fillMenuList(brandList, [{ value: '', label: 'Todas' }], '');

  const run = (): void => {
    void runSearch();
  };

  setupMenu(categoryMenu, categoryList, categoryLabel, run);
  setupMenu(brandMenu, brandList, brandLabel, run);

  chips.append(
    ...POPULAR_CHIPS.map((chip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = chip.q === '' && !chip.brand && !chip.category ? 'chip is-active' : 'chip';
      button.textContent = chip.label;
      button.addEventListener('click', () => {
        chips.querySelectorAll('.chip').forEach((node) => node.classList.remove('is-active'));
        button.classList.add('is-active');
        qInput.value = chip.q;
        categoryMenu.dataset.value = chip.category ?? '';
        categoryLabel.textContent = chip.category ?? 'Todas';
        brandMenu.dataset.value = chip.brand ?? '';
        brandLabel.textContent = chip.brand ?? 'Todas';
        clearButton.hidden = qInput.value.length === 0;
        run();
      });
      return button;
    }),
  );

  function render(results: SearchResultItem[], message?: string): void {
    grid.replaceChildren(...results.map(cardFor));
    count.textContent = `${results.length} producto${results.length === 1 ? '' : 's'}`;
    const empty = results.length === 0;
    emptyState.hidden = !empty;
    grid.hidden = empty;
    if (empty) {
      emptyTerm.textContent = qInput.value.trim() || 'ese producto';
      emptyText.textContent =
        message ?? 'Prueba Lubricantes, Motul o Shell. El texto libre espera el índice invertido.';
    }
  }

  async function runSearch(): Promise<void> {
    formError.textContent = '';
    notice.textContent = '';
    const priceMinRaw = priceMinInput.value.trim();
    const priceMaxRaw = priceMaxInput.value.trim();
    const category = categoryMenu.dataset.value ?? '';
    const brand = brandMenu.dataset.value ?? '';

    const response = await searchApi.search({
      q: qInput.value,
      brand,
      category: category === '' ? '' : PartCategory.parse(category),
      priceMin: priceMinRaw === '' ? null : Number(priceMinRaw),
      priceMax: priceMaxRaw === '' ? null : Number(priceMaxRaw),
    });

    if (response.notImplemented) {
      notice.textContent =
        response.message ?? 'Texto libre pendiente: implementa el índice invertido en algorithms.';
    }
    render(response.results, response.notImplemented ? response.message : undefined);
  }

  qInput.addEventListener('input', () => {
    clearButton.hidden = qInput.value.length === 0;
  });

  clearButton.addEventListener('click', () => {
    qInput.value = '';
    clearButton.hidden = true;
    run();
  });

  emptyReset.addEventListener('click', () => {
    qInput.value = '';
    clearButton.hidden = true;
    categoryMenu.dataset.value = '';
    categoryLabel.textContent = 'Todas';
    brandMenu.dataset.value = '';
    brandLabel.textContent = 'Todas';
    priceMinInput.value = '';
    priceMaxInput.value = '';
    run();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runSearch().catch((error: unknown) => {
      formError.textContent = error instanceof Error ? error.message : 'No se pudo buscar';
    });
  });

  document.addEventListener('click', () => closeMenus());

  partApi
    .list()
    .then((parts) => {
      const brands = [...new Set(parts.map((part) => part.brand))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      );
      fillMenuList(
        brandList,
        [{ value: '', label: 'Todas' }, ...brands.map((value) => ({ value, label: value }))],
        brandMenu.dataset.value ?? '',
      );
    })
    .catch(() => {
      /* marcas opcionales */
    });

  runSearch().catch(() => {
    formError.textContent =
      'No se pudo conectar con la API. Abre http://localhost:5173 con `npm run dev` (api+web). Si falla, corre `npm run migrate` y `npm run seed`.';
  });
}
