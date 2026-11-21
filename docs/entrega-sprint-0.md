# Entrega · Sprint 0

**Proyecto:** Mercado Libre · marketplace de repuestos (catálogo n.º 3)  
**Alumno:** (completa tu nombre)  
**Fecha:** 21 nov 2026

## Qué entregar aquí

| Ítem | Enlace |
| --- | --- |
| Repositorio | https://github.com/sebasartelugo/Mercado-libre |
| GitHub Project (público) | _(completa tras `gh auth refresh -s project,read:project` → `npm run backlog` → pestaña Projects del repo)_ |
| Release **v0.0.0** | https://github.com/sebasartelugo/Mercado-libre/releases/tag/v0.0.0 |
| Video 2 min (proyecto con `npm run dev`) | _(pega aquí el enlace de YouTube no listado o Drive cuando esté listo)_ |

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

- GitHub Project con el backlog (`gh auth refresh -s project,read:project` → `npm run backlog`)
- Implementar índice invertido en `src/shared/algorithms/` (reto H9.1)
- Ingeniería inversa en `clon/` (H1.2)
- Pegar el enlace del video en la tabla de arriba

## Nota Classroom

El remoto oficial de Classroom (`rootprueba586-ux/Mercado-libre`) no acepta push con la cuenta `sebasartelugo` (403). Entrega y release viven en **https://github.com/sebasartelugo/Mercado-libre**. Si el profesor exige el repo de Classroom, inicia sesión en `gh` con la cuenta `rootprueba586-ux` y vuelve a hacer push/`gh release create`.
