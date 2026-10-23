/**
 * Enums espejo del backend (src/shared/types/enums.ts).
 * Los valores deben coincidir con los que devuelve/espera la API.
 */
export enum Rol {
  Usuario = 'usuario',
  Administrador = 'administrador',
}

export enum TipoRecurso {
  Archivo = 'archivo',
  Carpeta = 'carpeta',
  Usuario = 'usuario',
  Sistema = 'sistema',
}

export enum NivelPermiso {
  Lectura = 'lectura',
  Escritura = 'escritura',
  Comentar = 'comentar',
}

export enum ExtensionArchivo {
  Txt = 'txt',
  Md = 'md',
}

export enum MimeType {
  Txt = 'text/plain',
  Md = 'text/markdown',
}

export enum AccionActividad {
  Crear = 'crear',
  Renombrar = 'renombrar',
  Mover = 'mover',
  ActualizarContenido = 'actualizar_Contenido',
  Abrir = 'abrir',
  Compartir = 'compartir',
  QuitarCompartido = 'quitar_compartido',
  EnviarPapelera = 'enviar_papelera',
  Restaurar = 'restaurar',
  EliminarPermanente = 'eliminar_permanente',
  Login = 'login',
  Desactivar = 'desactivar',
  Reactivar = 'reactivar',
  Registro = 'registro',
  Actualizar = 'actualizar',
}
