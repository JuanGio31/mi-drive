import { Carpeta, CompartidoCon, NivelPermiso } from '../models';
import { carpetaCompartidaConOtros, esCarpetaCompartida } from './carpetas';

const crearCarpeta = (propietario: string, compartidoCon: CompartidoCon[] = []): Carpeta => ({
  _id: 'carpeta-1',
  nombre: 'Documentos',
  propietario,
  carpetaPadre: null,
  compartidoCon,
  destacadoPor: [],
  enPapelera: false,
  fechaEnvioPapelera: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('utilidades de carpetas', () => {
  it('marca como compartida una carpeta de otro usuario', () => {
    expect(esCarpetaCompartida(crearCarpeta('u2'), 'u1')).toBe(true);
  });

  it('no marca como compartida una carpeta propia', () => {
    expect(esCarpetaCompartida(crearCarpeta('u1'), 'u1')).toBe(false);
  });

  it('no marca como compartida si falta el usuario', () => {
    expect(esCarpetaCompartida(crearCarpeta('u2'), null)).toBe(false);
  });

  it('detecta una carpeta propia compartida con otros', () => {
    const compartido: CompartidoCon = {
      usuario: 'u2',
      permiso: NivelPermiso.Lectura,
      fechaCompartido: '2026-01-02T00:00:00.000Z',
    };

    expect(carpetaCompartidaConOtros(crearCarpeta('u1', [compartido]), 'u1')).toBe(true);
  });

  it('no marca una carpeta propia sin comparticiones', () => {
    expect(carpetaCompartidaConOtros(crearCarpeta('u1'), 'u1')).toBe(false);
  });

  it('no marca como propia compartida una carpeta recibida', () => {
    const compartido: CompartidoCon = {
      usuario: 'u1',
      permiso: NivelPermiso.Lectura,
      fechaCompartido: '2026-01-02T00:00:00.000Z',
    };

    expect(carpetaCompartidaConOtros(crearCarpeta('u2', [compartido]), 'u1')).toBe(false);
  });
});
