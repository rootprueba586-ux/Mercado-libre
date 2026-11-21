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

/** Dos filas de la grilla (3 columnas en escritorio). El API ya devuelve el filtro completo. */
export const PAGE_SIZE = 6;

/**
 * Páginas que muestra el paginador. `null` es el hueco «…» entre bloques.
 * Siempre incluye la primera, la última y las vecinas de la actual.
 */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const window: (number | null)[] = [];
  for (const page of sorted) {
    const previous = window.at(-1);
    if (typeof previous === 'number' && page - previous > 1) window.push(null);
    window.push(page);
  }
  return window;
}

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
    applyMenu(menu, label, list, target.dataset.value ?? '');
    closeMenus();
    onChange();
  });
}

function applyMenu(menu: HTMLElement, label: HTMLElement, list: HTMLElement, value: string): void {
  menu.dataset.value = value;
  const selected = [...list.querySelectorAll('button')].find(
    (item): item is HTMLButtonElement =>
      item instanceof HTMLButtonElement && (item.dataset.value ?? '') === value,
  );
  label.textContent = selected?.textContent ?? (value === '' ? 'Todas' : value);
  list.querySelectorAll('button').forEach((item) => {
    if (item instanceof HTMLButtonElement) item.classList.toggle('is-on', item === selected);
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

function cardFor(item: SearchResultItem, onOpen: (item: SearchResultItem) => void): HTMLElement {
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

  // Capa transparente encima de la tarjeta: el clic abre la ficha (el CSS ya la tenía).
  const hit = document.createElement('button');
  hit.type = 'button';
  hit.className = 'product-card__hit';
  hit.setAttribute('aria-label', `Ver ficha de ${item.title}`);
  hit.addEventListener('click', () => onOpen(item));

  article.append(visual, body, hit);
  return article;
}

function priceStrong(value: number | null): HTMLElement {
  const strong = document.createElement('strong');
  if (value === null) {
    strong.textContent = '—';
    return strong;
  }
  const formatted = usd.format(value);
  const split = /^(.+?)([.,]\d+)$/.exec(formatted);
  if (!split) {
    strong.textContent = formatted;
    return strong;
  }
  strong.append(split[1] ?? formatted);
  const cents = document.createElement('em');
  cents.textContent = split[2] ?? '';
  strong.append(cents);
  return strong;
}

function fillSheet(item: SearchResultItem, visual: HTMLElement, content: HTMLElement): void {
  visual.replaceChildren();
  const glow = document.createElement('div');
  glow.className = 'product-modal__glow';
  visual.append(glow);

  if (item.imageUrl) {
    const img = document.createElement('img');
    img.className = 'product-modal__photo';
    img.src = item.imageUrl;
    img.alt = '';
    visual.append(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'product-modal__fallback';
    const logo = document.createElement('span');
    logo.className = 'product-card__logo';
    logo.textContent = initials(item.brand);
    fallback.append(logo);
    visual.append(fallback);
  }

  const tag = document.createElement('span');
  tag.className = 'product-modal__tag';
  tag.textContent = item.category;
  visual.append(tag);

  const brand = document.createElement('p');
  brand.className = 'product-modal__brand';
  brand.textContent = item.brand;

  const title = document.createElement('h2');
  title.id = 'product-modal-title';
  title.textContent = item.title;

  const price = document.createElement('div');
  price.className = 'product-modal__price';
  const priceText = document.createElement('div');
  const priceLabel = document.createElement('p');
  priceLabel.textContent = 'Precio';
  priceText.append(priceLabel, priceStrong(item.price));
  const priceNote = document.createElement('span');
  priceNote.textContent = item.price === null ? 'Sin precio publicado' : 'USD por unidad';
  price.append(priceText, priceNote);

  const description = document.createElement('p');
  description.className = 'product-modal__description';
  const extras = [item.viscosity, item.base].filter(Boolean).join(' · ');
  description.textContent = extras
    ? `${item.brand}. ${extras}. Categoría ${item.category}.`
    : `${item.brand}. Categoría ${item.category}.`;

  const data = document.createElement('dl');
  data.className = 'product-modal__data';
  const rows: [string, string][] = [];
  if (item.viscosity) rows.push(['Viscosidad', item.viscosity]);
  if (item.base) rows.push(['Base', item.base]);
  rows.push(['Categoría', item.category], ['SKU', item.sku || '—'], ['Marca', item.brand]);
  for (const [dtText, ddText] of rows) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = dtText;
    const dd = document.createElement('dd');
    dd.textContent = ddText;
    wrap.append(dt, dd);
    data.append(wrap);
  }

  content.replaceChildren(brand, title, price, description, data);
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
  const pager = byId<HTMLElement>('search-pager');
  const pagerPrev = byId<HTMLButtonElement>('pager-prev');
  const pagerNext = byId<HTMLButtonElement>('pager-next');
  const pagerListNode = pager.querySelector('[data-page-list]');
  if (!(pagerListNode instanceof HTMLElement)) throw new Error('No existe el listado de páginas');
  const pagerList: HTMLElement = pagerListNode;
  const sheet = byId<HTMLDialogElement>('product-modal');
  const sheetVisual = byId<HTMLDivElement>('product-modal-visual');
  const sheetContent = byId<HTMLDivElement>('product-modal-content');
  const sheetClose = byId<HTMLButtonElement>('product-modal-close');
  const categoryMenu = byId<HTMLDivElement>('menu-category');
  const categoryList = byId<HTMLUListElement>('menu-category-list');
  const categoryLabel = byId<HTMLSpanElement>('menu-category-label');
  const brandMenu = byId<HTMLDivElement>('menu-brand');
  const brandList = byId<HTMLUListElement>('menu-brand-list');
  const brandLabel = byId<HTMLSpanElement>('menu-brand-label');
  const clearCategory = byId<HTMLButtonElement>('clear-category');
  const clearBrand = byId<HTMLButtonElement>('clear-brand');
  const clearPriceMin = byId<HTMLButtonElement>('clear-price-min');
  const clearPriceMax = byId<HTMLButtonElement>('clear-price-max');

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
    runSearch().catch((error: unknown) => {
      formError.textContent = error instanceof Error ? error.message : 'No se pudo buscar';
    });
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
        applyMenu(categoryMenu, categoryLabel, categoryList, chip.category ?? '');
        applyMenu(brandMenu, brandLabel, brandList, chip.brand ?? '');
        priceMinInput.value = '';
        priceMaxInput.value = '';
        syncClears();
        run();
      });
      return button;
    }),
  );

  let catalog: SearchResultItem[] = [];
  let page = 1;
  let emptyMessage: string | undefined;

  function openSheet(item: SearchResultItem): void {
    fillSheet(item, sheetVisual, sheetContent);
    if (!sheet.open) sheet.showModal();
  }

  function paintPager(totalPages: number): void {
    const visible = catalog.length > 0 && totalPages > 1;
    pager.hidden = !visible;
    pagerPrev.disabled = page <= 1;
    pagerNext.disabled = page >= totalPages;
    if (!visible) {
      pagerList.replaceChildren();
      return;
    }
    pagerList.replaceChildren(
      ...pageWindow(page, totalPages).map((entry) => {
        if (entry === null) {
          const gap = document.createElement('span');
          gap.className = 'pager__gap';
          gap.textContent = '…';
          gap.setAttribute('aria-hidden', 'true');
          return gap;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(entry);
        button.classList.toggle('is-on', entry === page);
        button.setAttribute('aria-label', `Página ${entry}`);
        if (entry === page) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => goTo(entry));
        return button;
      }),
    );
  }

  function paint(): void {
    const total = catalog.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PAGE_SIZE;
    const slice = catalog.slice(start, start + PAGE_SIZE);
    grid.replaceChildren(...slice.map((item) => cardFor(item, openSheet)));
    count.textContent =
      total === 0
        ? '0 productos'
        : totalPages > 1
          ? `Página ${page} de ${totalPages} · ${total} productos`
          : `${total} producto${total === 1 ? '' : 's'}`;
    const empty = total === 0;
    emptyState.hidden = !empty;
    grid.hidden = empty;
    paintPager(totalPages);
    if (empty) {
      emptyTerm.textContent = qInput.value.trim() || 'ese producto';
      emptyText.textContent =
        emptyMessage ?? 'Prueba otro nombre, marca, categoría o rango de precio.';
    }
  }

  function goTo(next: number): void {
    const totalPages = Math.max(1, Math.ceil(catalog.length / PAGE_SIZE));
    page = Math.min(Math.max(next, 1), totalPages);
    paint();
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render(results: SearchResultItem[], message?: string): void {
    catalog = results;
    page = 1;
    emptyMessage = message;
    paint();
  }

  function syncClears(): void {
    clearButton.hidden = qInput.value.length === 0;
    clearCategory.hidden = (categoryMenu.dataset.value ?? '') === '';
    clearBrand.hidden = (brandMenu.dataset.value ?? '') === '';
    clearPriceMin.hidden = priceMinInput.value.trim() === '';
    clearPriceMax.hidden = priceMaxInput.value.trim() === '';
  }

  function clearFilter(event: Event, apply: () => void): void {
    event.preventDefault();
    event.stopPropagation();
    closeMenus();
    apply();
    syncClears();
    run();
  }

  async function runSearch(): Promise<void> {
    formError.textContent = '';
    notice.textContent = '';
    syncClears();
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
    syncClears();
  });

  priceMinInput.addEventListener('input', syncClears);
  priceMaxInput.addEventListener('input', syncClears);

  clearButton.addEventListener('click', () => {
    qInput.value = '';
    syncClears();
    run();
  });

  clearCategory.addEventListener('click', (event) => {
    clearFilter(event, () => applyMenu(categoryMenu, categoryLabel, categoryList, ''));
  });
  clearBrand.addEventListener('click', (event) => {
    clearFilter(event, () => applyMenu(brandMenu, brandLabel, brandList, ''));
  });
  clearPriceMin.addEventListener('click', (event) => {
    clearFilter(event, () => {
      priceMinInput.value = '';
    });
  });
  clearPriceMax.addEventListener('click', (event) => {
    clearFilter(event, () => {
      priceMaxInput.value = '';
    });
  });

  emptyReset.addEventListener('click', () => {
    qInput.value = '';
    applyMenu(categoryMenu, categoryLabel, categoryList, '');
    applyMenu(brandMenu, brandLabel, brandList, '');
    priceMinInput.value = '';
    priceMaxInput.value = '';
    chips.querySelectorAll('.chip').forEach((node, index) => {
      node.classList.toggle('is-active', index === 0);
    });
    syncClears();
    run();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run();
  });

  document.addEventListener('click', () => closeMenus());

  pagerPrev.addEventListener('click', () => goTo(page - 1));
  pagerNext.addEventListener('click', () => goTo(page + 1));
  sheetClose.addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) sheet.close();
  });

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
