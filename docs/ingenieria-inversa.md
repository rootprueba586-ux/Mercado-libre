# Ingeniería inversa · Mercado Libre Venezuela

> Historia H1.1. Sitio de referencia: [https://www.mercadolibre.com.ve/](https://www.mercadolibre.com.ve/).
> Las capturas están en `docs/img/`. Hay fotos de la portada y del listado, y también
> pestañas de DevTools: Elements, Network, Cookies y Lighthouse.
>
> Reglas: se recrea la experiencia, no la marca. No se descargan sus archivos. No se recrean
> pantallas de inicio de sesión ni de pago.

Fecha de la lectura en vivo de la portada: 27 nov 2026.

La portada y el listado de «filtro de aceite» los fotografió el alumno en su navegador.
Desde un navegador automatizado, el listado redirigía a `/gz/account-verification`;
esa pantalla de acceso no se documenta ni se recrea.

## 1. Estructura (pestaña Elements)

En `https://www.mercadolibre.com.ve/`:

- Sí usa `header` (1), `nav` (3), `main` (1), `footer` (1), `section` (6), un `h1` y un `form`.
- No usa `article` ni `aside`. Las tarjetas de producto son `h3` dentro de enlaces, no artículos.
- El layout medido es sobre todo Flexbox (262 nodos) y un poco de Grid (13). El `main` sale con
  `display: table-row`: el esqueleto de la portada sigue un esquema de tabla, no un grid moderno.
- El buscador es un `form` con `role="search"`, método GET y acción
  `https://www.mercadolibre.com.ve/jm/search`. El campo se llama `as_word`.
- Hay un enlace «Saltar el contenido» antes del header. El idioma del documento es `es-VE`.

## 2. Sistema de diseño (pestaña Elements → Computed)

Valores leídos en la portada. Son los del sitio real; en `clon/` se cambian por la marca propia.

| Elemento | Valor |
| --- | --- |
| Color principal (header) | `rgb(255, 230, 0)` · `#FFE600` |
| Color de acción (botón) | `rgb(52, 132, 250)` · `#3483FA`, texto blanco |
| Color de fondo de la página | `rgb(255, 255, 255)` |
| Color de fondo del `main` | `rgb(235, 235, 235)` · `#EBEBEB` |
| Tipografía de títulos (`h3`) | Proxima Nova, peso 700, 18.72 px |
| Tipografía de texto | `"Proxima Nova", -apple-system, Roboto, Arial, sans-serif` |
| Tamaño base del texto | 13 px en `body` |
| Espaciado típico | padding del buscador `10px 60px 10px 15px` |
| Radio de bordes | buscador 2 px; algunas nav 8 px; un botón 4 px abajo |

El precio de una tarjeta usa la clase `poly-component__price`. Las tarjetas del home usan
`andes-card`. Los carruseles usan `andes-carousel`.

## 3. Red (pestaña Network → Fetch/XHR)

Al cargar la portada:

- Casi no hay un API de catálogo. Los productos ya vienen en el HTML. Un ejemplo de ficha
  enlazada desde el home:
  `https://articulo.mercadolibre.com.ve/MLV-564623997-reproductor-pantalla-7-bluetooth-aux-usb-doble-din-mp5-mp3-_JM`
- Los estáticos salen de `https://http2.mlstatic.com/` (navegación, cookies, métricas).
- Lo único visto en Fetch fue métricas, repetidas, a
  `https://o11y-proxy-otel-frontend.meli.com/v1/metrics`.
- Buscar no es un XHR: el formulario navega con GET a `/jm/search?as_word=...`.
  Mercado Libre termina en un listado, por ejemplo
  `https://listado.mercadolibre.com.ve/filtro-de-aceite`.

Con «Envío gratis» activado, [09-listado-network.png](img/09-listado-network.png) muestra el listado
y la pestaña Fetch/XHR. Ahí se ven métricas, `tracks`, un anuncio (`Targeting.php`) y
`picturesCarousel` de un resultado. No aparece una petición aparte con el JSON del catálogo:
el listado sigue viniendo en el HTML.

En la portada también está `window.__NAVIGATION_PRELOADED_STATE__`:

```json
{
  "application": "ml-navigation-api",
  "os": "windows",
  "siteId": "MLV",
  "domain": "mercadolibre.com.ve"
}
```

## 4. Estado (pestaña Application)

- La portada no guarda la búsqueda en la URL. La búsqueda viaja en `as_word` al enviar el form
  y después vive en la ruta del listado (`listado.mercadolibre.com.ve/<texto>`).
- `localStorage` y `sessionStorage` estaban vacíos en la portada.
- Cookies leídas en vivo (solo el nombre, no el valor): `_d2id`, `_mldataSessionId`, `g_state`,
  `_hjSessionUser_720735`, `_hjSession_720735`, `_gcl_au`. Mezclan sesión del sitio con
  analítica (Hotjar y Google). En [06-cookies.png](img/06-cookies.png) la tabla sale vacía a
  propósito: publicar la columna Value dejaría identificadores de la sesión. El panel sí es
  Application → Cookies de `www.mercadolibre.com.ve`.
- Abajo hay un aviso: «Usamos cookies…» con botones «Aceptar cookies» y «Configurar cookies».

## 5. Rendimiento y accesibilidad (pestaña Lighthouse)

Medido el 27 nov 2026 con Lighthouse en escritorio (navegación, ventana ancha).
El original es `https://www.mercadolibre.com.ve/`. Mi versión es `clon/index.html`
servida en local (`http://127.0.0.1:4173/clon/index.html`) con el preset de escritorio,
el mismo tipo de corrida que la del original. Los números salen de esas corridas; no están estimados.

| Métrica | Sitio original | Mi versión |
| --- | --- | --- |
| Rendimiento | 86 · [11-lighthouse-original.png](img/11-lighthouse-original.png) | 98 · [13-lighthouse-clon.png](img/13-lighthouse-clon.png) |
| Accesibilidad | 96 · misma captura | 100 · misma captura |
| Buenas prácticas | 73 · misma captura | 100 · misma captura |

## 6. Hallazgos

Las fotos de esta tabla salen de las dos capturas del alumno. El recorte muestra la zona;
no es una pestaña de DevTools.

| # | Hallazgo | Captura |
| --- | --- | --- |
| 1 | La portada junta buscador, carrusel y tarjetas de categoría en una sola pantalla. | [01-inicio.png](img/01-inicio.png) |
| 2 | El header es una franja amarilla con logo, buscador y accesos (Categorías, Historial, compras). | [03-header.png](img/03-header.png) |
| 3 | El buscador de la portada pide «Buscar productos, marcas y más…». | [04-buscador.png](img/04-buscador.png) |
| 4 | Debajo del carrusel hay tarjetas grandes (Espacio de trabajo, Mundo gaming, Para tu vehículo, Bienestar) con precio tachado y precio actual. | [01-tarjetas.png](img/01-tarjetas.png) |
| 5 | Buscar «filtro de aceite» abre un listado con migas de pan, más de 9.999 resultados y orden «Más relevantes». | [08-listado.png](img/08-listado.png) |
| 6 | A la izquierda se filtra sin recargar a otra marca: envío gratis, categoría (filtros de aceite, de aire, de gasolina…), condición (nuevo/usado) y costo de envío. | [08-filtros.png](img/08-filtros.png) |
| 7 | Cada resultado muestra foto, título, vendidos, precio en US$, descuento y «Envío gratis». | [08-resultados.png](img/08-resultados.png) |
| 8 | En el DOM de la portada hay `header`, `nav`, `main` y `footer`, y no hay `article` ni `aside`. El `main` usa `display: table-row`. | [02-elements.png](img/02-elements.png) |
| 9 | El formulario de búsqueda es GET a `/jm/search` con el campo `as_word`. Al cargar, el catálogo ya viene en el HTML; lo visto en Fetch fueron métricas. | [05-network.png](img/05-network.png) |
| 10 | Cookies de sesión y de analítica; los valores no se publican. `localStorage` vacío en la portada. Texto base de 13 px e imágenes sin `alt`. | [06-cookies.png](img/06-cookies.png) |
| 11 | Lighthouse de la portada: rendimiento 86, accesibilidad 96, buenas prácticas 73. | [11-lighthouse-original.png](img/11-lighthouse-original.png) |
| 12 | Abajo de la portada está el aviso «Usamos cookies…». La ficha muestra título, precio y foto. | [12-banner-cookies.png](img/12-banner-cookies.png) · [10-detalle.png](img/10-detalle.png) |

## 7. Tres mejoras que hice en mi versión (H1.3)

Las tres pantallas están en `clon/`: `index.html`, `listado.html` y `detalle.html`.
El nombre y el logo se cambian en `main.js` (`BRAND`). Los colores, en `styles.css` (`:root`).
La columna «Mi versión» de la sección 5 sale de la captura [13-lighthouse-clon.png](img/13-lighthouse-clon.png).

1. **Texto demasiado chico.** El `body` del original está a 13 px. En `clon/styles.css` el texto base es 16 px.
2. **Controles sin nombre y gris ilegible.** En el original hay imágenes sin `alt` y enlaces cuyo nombre es `.`, `0`
   o vacío. En la recreación cada foto lleva el nombre del repuesto en `alt` y cada enlace tiene texto visible.
   El gris `--muted` pasó de `#6e706c` a `#545650`: sobre el papel `#e8e5dc` el contraste sube de 3.97:1 a 5.90:1,
   por encima del 4.5:1 que pide Lighthouse.
3. **La búsqueda no se puede retomar.** En la portada el término no queda en la URL y a veces el
   listado pide cuenta. En la recreación el listado abre directo y el término va en la URL
   (`listado.html?q=filtro+de+aceite`), sin pantalla de acceso ni de pago.

## Capturas que ya están

Salen de las dos fotos. Un recorte no puede inventar una pestaña que no se fotografió.

| Archivo | Qué es |
| --- | --- |
| `01-inicio.png` | Portada completa |
| `03-header.png` | Franja amarilla: logo, buscador y menú |
| `04-buscador.png` | Solo el campo «Buscar productos, marcas y más…» |
| `01-tarjetas.png` | Las cuatro tarjetas de categoría |
| `08-listado.png` | Listado de filtro de aceite |
| `08-filtros.png` | Columna izquierda de filtros |
| `08-resultados.png` | Primera fila de resultados con precio |
| `09-listado-network.png` | Listado con «Envío gratis» y Network → Fetch/XHR |
| `02-elements.png` | Elements: `header`, `nav`, `main` y `footer` |
| `05-network.png` | Network → Fetch/XHR al cargar la portada |
| `06-cookies.png` | Application → Cookies, sin valores (seguridad) |
| `10-detalle.png` | Ficha: título, precio y foto |
| `11-lighthouse-original.png` | Lighthouse de la portada: 86, 96 y 73 |
| `12-banner-cookies.png` | Aviso «Aceptar cookies» al pie de la portada |
| `13-lighthouse-clon.png` | Lighthouse de `clon/index.html` en escritorio: 98, 100 y 100 |
| `clon-inicio-1280.png` | Inicio de Locxides a 1280 px |
| `clon-inicio-375.png` | Inicio de Locxides a 375 px |
| `clon-listado-1280.png` | Listado «filtro de aceite» a 1280 px |
| `clon-listado-375.png` | Listado «filtro de aceite» a 375 px |
| `clon-detalle-1280.png` | Ficha del filtro A1L-3387 a 1280 px |
| `clon-detalle-375.png` | Ficha del filtro A1L-3387 a 375 px |
