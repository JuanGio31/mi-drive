import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Archivo, Carpeta, ExtensionArchivo, NivelPermiso } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { AccionesRecursosService } from '../contextual/acciones-recursos.service';
import { DestacadosComponent } from './destacados';

const carpeta: Carpeta = {
  _id: 'carpeta-1',
  nombre: 'Proyecto',
  propietario: 'usuario-1',
  miPermiso: NivelPermiso.Escritura,
  carpetaPadre: null,
  compartidoCon: [],
  destacadoPor: ['usuario-1'],
  enPapelera: false,
  fechaEnvioPapelera: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const archivo: Archivo = {
  _id: 'archivo-1',
  nombre: 'notas.md',
  tipo: ExtensionArchivo.Md,
  contenido: '',
  tamanio: 120,
  propietario: 'usuario-1',
  miPermiso: NivelPermiso.Escritura,
  carpetaPadre: null,
  compartidoCon: [],
  destacadoPor: ['usuario-1'],
  enPapelera: false,
  fechaEnvioPapelera: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DestacadosComponent', () => {
  let fixture: ComponentFixture<DestacadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestacadosComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { usuario: signal({ id: 'usuario-1' }) },
        },
        {
          provide: CarpetaService,
          useValue: { listarDestacadas: () => of([carpeta]) },
        },
        {
          provide: ArchivoService,
          useValue: { listarDestacados: () => of([archivo]) },
        },
        {
          provide: AccionesRecursosService,
          useValue: { ejecutar: () => Promise.resolve(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DestacadosComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  });

  it('muestra las carpetas y archivos destacados', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Destacados');
    expect(texto).toContain('Proyecto');
    expect(texto).toContain('notas.md');
  });
});
