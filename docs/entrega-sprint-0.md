# Entrega · Sprint 0

**Proyecto:** Mercado Libre · marketplace de repuestos (catálogo n.º 3)  
**Alumno:** (Sebastian Arteaga CI:28.307.667)  
**Fecha:** 21 nov 2026

## Qué entregar aquí

| Ítem | Enlace |
| --- | --- |
| Repositorio | https://github.com/rootprueba586-ux/Mercado-libre |
| GitHub Project (público) | _(completa con la cuenta `rootprueba586-ux` → `npm run backlog` → pestaña Projects del repo)_ |
| Release **v0.0.0** | https://github.com/rootprueba586-ux/Mercado-libre/releases/tag/v0.0.0 |
| Video 2 min (proyecto con `npm run dev`) | https://youtu.be/gGbqTVKKtlU |

## Cómo arrancar lo que muestra el video

```bash
docker compose up -d
npm install
cp .env.example .env   # en Windows: Copy-Item .env.example .env
npm run migrate
npm run seed
npm run dev
```

Abre **http://localhost:5173**: búsqueda con UI tipo lab Aceite, catálogo en PostgreSQL (74 productos con imagen, marcas y categorías reales: Lubricantes, Filtros, etc.).

## Qué incluye este release

- Plantilla del curso conectada al repo + personalización `mercado-libre`
- Migraciones PostgreSQL `001`–`003` (`parts`, `search_terms`, campos Aceite)
- Funcionalidades `src/parts` y `src/search` (filtros SQL; texto libre pendiente del índice a mano)
- UI de búsqueda portada del laboratorio Aceite + imágenes en `src/app/web/productos/`
- Seed desde `db/data/products.json` (mismo catálogo Aceite)
- ADR `docs/adr/0003-inverted-index-search.md` y reglas en `.cursor/rules/`

## Pendiente (siguientes sprints)

- GitHub Project con el backlog (cuenta `rootprueba586-ux` → `npm run backlog`)
- Implementar índice invertido en `src/shared/algorithms/` (reto H9.1)
- Ingeniería inversa en `clon/` (H1.2)

## Nota Classroom

La entrega oficial es el repo de Classroom: **https://github.com/rootprueba586-ux/Mercado-libre** (cuenta `rootprueba586-ux`, correo `rootprueba586@gmail.com`). `origin` ya apunta ahí y `main` está sincronizado.

La copia personal https://github.com/sebasartelugo/Mercado-libre (correo `sebas.artelugo@gmail.com`) no es la entrega. Su release `v0.0.0` quedó en un commit anterior y no sustituye al del repo de Classroom.
