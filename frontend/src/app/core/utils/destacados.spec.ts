import { esRecursoDestacado } from './destacados';

describe('utilidades de destacados', () => {
  it('marca un recurso destacado por el usuario actual', () => {
    expect(esRecursoDestacado({ destacadoPor: ['u1'] }, 'u1')).toBe(true);
  });

  it('no marca un recurso destacado por otro usuario', () => {
    expect(esRecursoDestacado({ destacadoPor: ['u2'] }, 'u1')).toBe(false);
  });

  it('no marca un recurso sin destacados', () => {
    expect(esRecursoDestacado({ destacadoPor: [] }, 'u1')).toBe(false);
  });

  it('no marca un recurso antiguo sin el campo', () => {
    expect(esRecursoDestacado({}, 'u1')).toBe(false);
  });

  it('no marca si falta el usuario', () => {
    expect(esRecursoDestacado({ destacadoPor: ['u1'] }, null)).toBe(false);
  });
});
