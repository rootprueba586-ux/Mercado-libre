// Ventana del paginador de la búsqueda: números visibles y huecos «…».
import { describe, expect, it } from 'vitest';
import { pageWindow } from '../../src/search/search.view.ts';

describe('pageWindow', () => {
  it('no muestra huecos cuando hay pocas páginas', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('recorta el medio y deja la primera y la última', () => {
    expect(pageWindow(1, 13)).toEqual([1, 2, 3, 4, null, 13]);
    expect(pageWindow(7, 13)).toEqual([1, null, 6, 7, 8, null, 13]);
    expect(pageWindow(13, 13)).toEqual([1, null, 10, 11, 12, 13]);
  });
});
