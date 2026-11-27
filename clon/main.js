/*
  Nombre de las pantallas. El dibujo del logo es logo.svg.
  Los colores están en styles.css, en el bloque :root.
  La página marca.html los muestra juntos.
*/
const BRAND = {
  name: "Loxcides",
  tagline: "Marketplace de repuestos",
};

const PHOTO = "../src/app/web/productos";

const CATALOG = [
  {
    id: "a1l-3387",
    name: "Filtro de aceite A Filters A1L-3387",
    brand: "A Filters",
    category: "Filtros",
    sku: "A1L-3387",
    price: 9.99,
    image: `${PHOTO}/a-filters/filtros/a1l-3387.webp`,
    summary: "Filtro de aceite para el cambio periódico.",
  },
  {
    id: "l12222",
    name: "Purolator filtro de aceite Classic L12222",
    brand: "Purolator",
    category: "Filtros",
    sku: "L12222",
    price: 9.99,
    image: `${PHOTO}/purolator/filtros/l12222.webp`,
    summary: "Filtro de aceite de recambio, línea Classic.",
  },
  {
    id: "ls-cha-fg",
    name: "Champion Filters filtro de gasolina",
    brand: "Champion Filters",
    category: "Filtros",
    sku: "LS-CHA-FG",
    price: 9.99,
    image: `${PHOTO}/champion-filters/filtros/ls-cha-fg.webp`,
    summary: "Filtro de gasolina. Sirve para probar la búsqueda por la palabra filtro junto con el de aceite.",
  },
  {
    id: "23390-0l041",
    name: "Elemento / filtro de combustible 23390-0L041",
    brand: "Toyota / Lexus Genuine",
    category: "Filtros",
    sku: "23390-0L041",
    price: 9.99,
    image: `${PHOTO}/toyota-lexus-genuine/filtros/23390-0l041.webp`,
    summary: "Elemento de combustible original de línea Toyota / Lexus.",
  },
  {
    id: "sky-0w20",
    name: "SKY F1 0W-20 sintético API SP 946 ml",
    brand: "SKY",
    category: "Lubricantes",
    sku: "SKY-0W20",
    price: 9.99,
    image: `${PHOTO}/sky/lubricantes/sky-0w20.webp`,
    summary: "Aceite sintético 0W-20, presentación de 946 ml.",
  },
  {
    id: "mot-5w40",
    name: "Motul 8100 X-cess gen2 5W-40 100% sintético API SN 1 L",
    brand: "Motul",
    category: "Lubricantes",
    sku: "MOT-5W40",
    price: 9.99,
    image: `${PHOTO}/motul/lubricantes/mot-5w40.webp`,
    summary: "Aceite 100% sintético 5W-40 en envase de 1 L.",
  },
  {
    id: "sky-ref-v",
    name: "SKY refrigerante verde ELC 50/50 3.785 L",
    brand: "SKY",
    category: "Refrigerante",
    sku: "SKY-REF-V",
    price: 9.99,
    image: `${PHOTO}/sky/refrigerante/sky-ref-v.webp`,
    summary: "Refrigerante verde listo para usar, garrafa de 3.785 L.",
  },
  {
    id: "10-4090",
    name: "ACDelco fluido para frenos y embragues DOT 3 1 L",
    brand: "ACDelco",
    category: "Frenos",
    sku: "10-4090",
    price: 9.99,
    image: `${PHOTO}/acdelco/frenos/10-4090.webp`,
    summary: "Fluido de frenos DOT 3, envase de 1 L.",
  },
];

const page = document.body.dataset.page;
let selectedId = new URLSearchParams(location.search).get("id");

dismissPageLoader();
applyBrand();
wireNavigation();
show(page || "home");

/** Cierra el loader de marca tras la animación (o al instante si hay reduced-motion). */
function dismissPageLoader() {
  const loader = document.getElementById("page-loader");
  if (!(loader instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const holdMs = reduceMotion ? 0 : 2100;
  const fadeMs = reduceMotion ? 0 : 420;

  window.setTimeout(() => {
    loader.classList.add("is-done");
    loader.setAttribute("aria-busy", "false");
    window.setTimeout(() => loader.remove(), fadeMs);
  }, holdMs);
}

function applyBrand() {
  document.querySelectorAll("[data-brand='name']").forEach((node) => {
    node.textContent = BRAND.name;
  });
  document.querySelectorAll("[data-brand='tagline']").forEach((node) => {
    node.textContent = BRAND.tagline;
  });
}

/** El guion normal deja el código en dos renglones (A1L- y 3387). Este no se parte. */
function label(text) {
  return text.replaceAll("-", "\u2011");
}

function renderHome() {
  const featured = document.querySelector("#featured");
  featured.replaceChildren();
  for (const part of CATALOG.slice(0, 3)) featured.append(card(part));

  const categories = document.querySelector("#categories");
  categories.querySelectorAll("a").forEach((node) => node.remove());
  const names = [...new Set(CATALOG.map((part) => part.category))];
  for (const name of names) {
    const link = document.createElement("a");
    link.className = "chip";
    link.href = `listado.html?category=${encodeURIComponent(name)}`;
    link.textContent = name;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      remember({ category: name });
      show("list");
    });
    categories.append(link);
  }
}

function renderList() {
  const params = new URLSearchParams(location.search);
  const form = document.querySelector("#filters");
  form.q.value = params.get("q") || "";
  form.min.value = params.get("min") || "";
  form.max.value = params.get("max") || "";
  fillSelect(form.category, "Todas", unique("category"), params.get("category"));
  fillSelect(form.brand, "Todas", unique("brand"), params.get("brand"));

  const found = CATALOG.filter((part) => matches(part, params));
  const heading = document.querySelector("#list-title");
  const term = (params.get("q") || params.get("category") || "").trim();
  heading.textContent = term ? term : "Todos los repuestos";

  document.querySelector("#count").textContent = `${found.length} productos`;
  const grid = document.querySelector("#results");
  const empty = document.querySelector("#empty");
  grid.replaceChildren();
  if (found.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  for (const part of found) grid.append(card(part));
}

function renderDetail() {
  const requested = selectedId || new URLSearchParams(location.search).get("id");
  const id = requested || CATALOG[0].id;
  const part = CATALOG.find((item) => item.id === id);
  const mount = document.querySelector("#detail");
  mount.replaceChildren();
  if (!part) {
    const box = document.createElement("div");
    box.className = "empty";
    const title = document.createElement("h2");
    title.textContent = "Ese repuesto no está en el catálogo de muestra.";
    const back = document.createElement("a");
  back.className = "button";
  back.href = "listado.html";
  back.textContent = "Volver al listado";
  back.addEventListener("click", (event) => {
    event.preventDefault();
    remember({});
    show("list");
  });
    box.append(title, back);
    mount.append(box);
    return;
  }

  const visual = document.createElement("div");
  visual.className = "detail__visual";
  visual.append(photo(part));

  const content = document.createElement("div");
  const brand = document.createElement("p");
  brand.className = "brand-name";
  brand.textContent = part.brand;
  const title = document.createElement("h1");
  title.textContent = label(part.name);
  const price = document.createElement("div");
  price.className = "price-panel";
  const priceText = document.createElement("div");
  const priceLabel = document.createElement("p");
  priceLabel.textContent = "Precio";
  const amount = document.createElement("strong");
  amount.textContent = money(part.price);
  priceText.append(priceLabel, amount);
  const note = document.createElement("span");
  note.textContent = part.summary;
  price.append(priceText, note);

  const specs = document.createElement("dl");
  specs.className = "spec";
  for (const [label, value] of [["Marca", part.brand], ["Categoría", part.category], ["SKU", part.sku]]) {
    const term = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    term.append(dt, dd);
    specs.append(term);
  }

  const back = document.createElement("a");
  back.className = "button";
  back.href = `listado.html?category=${encodeURIComponent(part.category)}`;
  back.textContent = "Volver al listado";
  back.addEventListener("click", (event) => {
    event.preventDefault();
    remember({ category: part.category });
    show("list");
  });
  content.append(brand, title, price, specs, back);
  mount.append(visual, content);
}

function card(part) {
  const link = document.createElement("a");
  link.className = "product-card";
  link.href = `detalle.html?id=${encodeURIComponent(part.id)}`;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    selectedId = part.id;
    show("detail");
  });
  const visual = document.createElement("div");
  visual.className = "product-card__visual";
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = part.category;
  const ticket = document.createElement("span");
  ticket.className = "price-ticket";
  const currency = document.createElement("small");
  currency.textContent = "USD";
  ticket.append(currency, document.createTextNode(part.price.toFixed(2)));
  visual.append(photo(part), tag, ticket);
  const body = document.createElement("div");
  body.className = "product-card__body";
  const brand = document.createElement("p");
  brand.className = "brand-name";
  brand.textContent = part.brand;
  const name = document.createElement("h3");
  name.textContent = label(part.name);
  const sku = document.createElement("p");
  sku.className = "sku";
  sku.textContent = part.sku;
  body.append(brand, name, sku);
  link.append(visual, body);
  return link;
}

function photo(part) {
  const wrap = document.createElement("span");
  wrap.className = "monogram";
  wrap.setAttribute("aria-hidden", "true");
  wrap.textContent = part.brand.slice(0, 2).toUpperCase();
  const image = document.createElement("img");
  image.src = part.image;
  image.alt = part.name;
  image.addEventListener("error", () => {
    image.remove();
  });
  wrap.append(image);
  return wrap;
}

function matches(part, params) {
  const tokens = (params.get("q") || "").toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${part.name} ${part.brand} ${part.sku} ${part.category}`.toLowerCase();
  if (!tokens.every((token) => haystack.includes(token))) return false;
  if (params.get("category") && part.category !== params.get("category")) return false;
  if (params.get("brand") && part.brand !== params.get("brand")) return false;
  const min = Number(params.get("min"));
  const max = Number(params.get("max"));
  if (params.get("min") && part.price < min) return false;
  if (params.get("max") && part.price > max) return false;
  return true;
}

function fillSelect(select, firstLabel, values, current) {
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.append(first);
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === current;
    select.append(option);
  }
}

function unique(key) {
  return [...new Set(CATALOG.map((part) => part[key]))].sort((a, b) => a.localeCompare(b, "es"));
}

function show(view) {
  document.querySelectorAll("[data-screen]").forEach((section) => {
    section.hidden = section.dataset.screen !== view;
  });
  document.querySelectorAll("nav [data-view]").forEach((link) => {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const titles = { home: "Inicio", list: "Listado", detail: "Ficha", brand: "Marca" };
  document.title = `${BRAND.name} · ${titles[view] || "Inicio"}`;
  if (view === "home") renderHome();
  if (view === "list") renderList();
  if (view === "detail") renderDetail();
  if (view === "brand") renderBrand();
}

function wireNavigation() {
  document.querySelectorAll("[data-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (link.dataset.id) selectedId = link.dataset.id;
      show(link.dataset.view);
    });
  });

  const homeSearch = document.querySelector("#home-search");
  if (homeSearch) {
    homeSearch.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = homeSearch.q.value.trim();
      remember(q ? { q } : {});
      show("list");
    });
  }

  const filters = document.querySelector("#filters");
  if (filters) {
    filters.addEventListener("submit", (event) => {
      event.preventDefault();
      remember(Object.fromEntries(new FormData(filters)));
      show("list");
    });
  }

  const reset = document.querySelector("#empty-reset");
  if (reset) {
    reset.addEventListener("click", (event) => {
      event.preventDefault();
      remember({});
      show("list");
    });
  }
}

function remember(values) {
  const url = new URL(location.href);
  url.search = "";
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
  }
  history.replaceState(null, "", url.href);
}

function renderBrand() {
  const root = getComputedStyle(document.documentElement);
  document.querySelectorAll("[data-color]").forEach((item) => {
    const value = root.getPropertyValue(item.dataset.color).trim();
    item.querySelector(".swatch").style.background = value;
    item.querySelector("code").textContent = `${item.dataset.color} · ${value}`;
  });
}

function money(amount) {
  return `US$ ${amount.toFixed(2)}`;
}
