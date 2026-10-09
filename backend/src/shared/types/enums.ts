export enum Rol {
  Usuario = "usuario",
  Administrador = "administrador",
}

export enum TipoRecurso {
  Archivo = "archivo",
  Carpeta = "carpeta",
  Usuario = "usuario",
  Permiso = "permiso",
  Ninguno = "ninguno",
}

export enum NivelPermiso {
  Lectura = "lectura",
  Escritura = "escritura",
}

export enum ExtensionArchivo {
  Txt = "txt",
  Md = "md",
}

export enum MimeType {
  Txt = "text/plain",
  Md = "text/markdown",
}

export enum AccionActividad {
  CrearCarpeta = "crear_carpeta",
  RenombrarCarpeta = "renombrar_carpeta",
  MoverCarpeta = "mover_carpeta",
  EliminarCarpeta = "eliminar_carpeta",
  RestaurarCarpeta = "restaurar_carpeta",
  EliminarDefinitivoCarpeta = "eliminar_definitivo_carpeta",
  SubirArchivo = "subir_archivo",
  DescargarArchivo = "descargar_archivo",
  RenombrarArchivo = "renombrar_archivo",
  MoverArchivo = "mover_archivo",
  EditarArchivo = "editar_archivo",
  EliminarArchivo = "eliminar_archivo",
  RestaurarArchivo = "restaurar_archivo",
  EliminarDefinitivoArchivo = "eliminar_definitivo_archivo",
  Compartir = "compartir",
  RevocarPermiso = "revocar_permiso",
  Destacar = "destacar",
  QuitarDestacado = "quitar_destacado",
  IniciarSesion = "iniciar_sesion",
  CerrarSesion = "cerrar_sesion",

  CopiarCarpeta = "copiar_carpeta",
  CopiarArchivo = "copiar_archivo",
}
