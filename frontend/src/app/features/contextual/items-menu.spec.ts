import { itemsMenuUnidad } from './items-menu';

describe('menú contextual de recursos', () => {
  it('ofrece destacar un recurso no destacado', () => {
    const destacar = itemsMenuUnidad(false, false)[0];

    expect(destacar).toEqual({
      id: 'destacar',
      etiqueta: 'Destacar',
      icono: 'star_border',
    });
  });

  it('ofrece quitar un recurso destacado', () => {
    const destacar = itemsMenuUnidad(false, false, true)[0];

    expect(destacar).toEqual({
      id: 'destacar',
      etiqueta: 'Quitar de destacados',
      icono: 'star',
    });
  });

  it('permite destacar con permiso de solo lectura', () => {
    const acciones = itemsMenuUnidad(false, false).map((item) => item.id);

    expect(acciones).toContain('destacar');
    expect(acciones).not.toContain('renombrar');
    expect(acciones).not.toContain('compartir');
  });

  it('mantiene las acciones del propietario', () => {
    const acciones = itemsMenuUnidad(true, true).map((item) => item.id);

    expect(acciones).toEqual([
      'destacar',
      'detalles',
      'renombrar',
      'mover',
      'compartir',
      'papelera',
    ]);
  });
});
