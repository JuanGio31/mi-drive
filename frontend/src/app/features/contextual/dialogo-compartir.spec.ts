import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Carpeta, ItemRecurso, NivelPermiso, Rol } from '../../core/models';
import { UsuarioService } from '../../core/services/usuario-service';
import { DialogoCompartirComponent } from './dialogo-compartir';

const carpeta: Carpeta = {
  _id: 'carpeta-1',
  nombre: 'Proyecto',
  propietario: 'usuario-1',
  carpetaPadre: null,
  compartidoCon: [
    {
      usuario: 'usuario-2',
      permiso: NivelPermiso.Lectura,
      fechaCompartido: '2026-01-01T00:00:00.000Z',
    },
  ],
  destacadoPor: [],
  enPapelera: false,
  fechaEnvioPapelera: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const item: ItemRecurso = { tipo: 'carpeta', carpeta };

describe('DialogoCompartirComponent', () => {
  let fixture: ComponentFixture<DialogoCompartirComponent>;
  let component: DialogoCompartirComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoCompartirComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { item, usuarioActualId: 'usuario-1' },
        },
        {
          provide: MatDialogRef,
          useValue: { close: () => undefined },
        },
        {
          provide: UsuarioService,
          useValue: {
            directorio: () =>
              of([
                { _id: 'usuario-1', nombre: 'Ana', correo: 'ana@dms.local', rol: Rol.Usuario },
                {
                  _id: 'usuario-2',
                  nombre: 'Carlos',
                  correo: 'carlos@dms.local',
                  rol: Rol.Usuario,
                },
                { _id: 'usuario-3', nombre: 'Lucía', correo: 'lucia@dms.local', rol: Rol.Usuario },
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogoCompartirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
  });

  it('oculta a los usuarios que ya tienen acceso directo', () => {
    expect(component.opciones().map((usuario) => usuario._id)).toEqual(['usuario-3']);
  });

  it('no permite seleccionar a un usuario ya compartido', () => {
    component.alElegir('usuario-2');

    expect(component.usuarioId).toBeNull();
  });
});
