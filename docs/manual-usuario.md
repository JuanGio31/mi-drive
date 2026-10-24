<div class="portada">
  <img class="portada-fondo" src="portada.jpg" alt="">
  <div class="portada-contenido">
    <p class="portada-universidad">
      Universidad de San Carlos de Guatemala<br>
      Centro Universitario de Occidente<br>
      División de Ciencias de la Ingeniería<br>
      Ingeniería en Ciencias y Sistemas<br>
      Manejo e Implementación de Archivos
    </p>
    <img class="portada-logo" src="assets/logo-usac.png" alt="Escudo de la Universidad de San Carlos de Guatemala">
    <div class="portada-titulo">
      <span class="portada-sistema">Sistema de Gestión Documental</span>
      <strong class="portada-manual">Manual de usuario</strong>
      <span class="portada-subtitulo">Guía para organizar, editar, compartir y administrar documentos</span>
    </div>
    <p class="portada-autor">Juan Giovani Casiá Pérez<br><span>201930457</span></p>
    <p class="portada-fecha">sábado, 24 de octubre de 2026</p>
  </div>
</div>

# Índice

1. [Introducción](#1-introducción)
2. [Requisitos y acceso](#2-requisitos-y-acceso)
3. [Inicio de sesión](#3-inicio-de-sesión)
4. [Conocer la interfaz](#4-conocer-la-interfaz)
   - [4.1 Barra lateral](#41-barra-lateral)
   - [4.2 Barra superior](#42-barra-superior)
   - [4.3 Menú contextual](#43-menú-contextual-de-cada-recurso)
   - [4.4 Inicio, Recientes y Compartidos](#44-inicio-recientes-y-compartidos)
5. [Mi Unidad](#5-mi-unidad)
   - [5.1 Navegar por carpetas](#51-navegar-por-carpetas)
   - [5.2 Cambiar entre lista y cuadrícula](#52-cambiar-entre-lista-y-cuadrícula)
   - [5.3 Contenido de una carpeta](#53-contenido-de-una-carpeta)
   - [5.4 Filtrar por tipo](#54-filtrar-por-tipo)
6. [Crear carpetas y archivos](#6-crear-carpetas-y-archivos)
   - [6.1 Crear una carpeta](#61-crear-una-carpeta)
   - [6.2 Crear un archivo de texto o Markdown](#62-crear-un-archivo-de-texto-o-markdown)
   - [6.3 Subir un archivo](#63-subir-un-archivo)
7. [Abrir y leer un archivo](#7-abrir-y-leer-un-archivo)
8. [Editar un archivo](#8-editar-un-archivo)
9. [Compartir y permisos](#9-compartir-y-permisos)
   - [9.1 Compartir un recurso](#91-compartir-un-recurso)
   - [9.2 Niveles de permiso](#92-niveles-de-permiso)
   - [9.3 Consultar quién tiene acceso](#93-consultar-quién-tiene-acceso)
   - [9.4 Destacar un recurso](#94-destacar-un-recurso)
10. [Renombrar y ver detalles](#10-renombrar-y-ver-detalles)
    - [10.1 Renombrar](#101-renombrar)
    - [10.2 Ver detalles](#102-ver-detalles)
    - [10.3 Mover un recurso](#103-mover-un-recurso)
11. [Buscar en el sistema](#11-buscar-en-el-sistema)
12. [Papelera](#12-papelera)
    - [12.1 Enviar a la papelera](#121-enviar-a-la-papelera)
    - [12.2 Restaurar](#122-restaurar)
    - [12.3 Eliminar permanentemente](#123-eliminar-permanentemente)
    - [12.4 Limitaciones](#124-limitaciones)
13. [Mi perfil](#13-mi-perfil)
14. [Panel de administración](#14-panel-de-administración)
    - [14.1 Dashboard](#141-dashboard)
    - [14.2 Usuarios](#142-usuarios)
    - [14.3 Reportes](#143-reportes)
    - [14.4 Actividad del sistema](#144-actividad-del-sistema)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)
16. [Glosario](#16-glosario)

# 1. Introducción

El **Sistema de Gestión Documental (DMS)** permite guardar y organizar archivos de
texto y Markdown en una unidad personal, compartirlos con otros miembros de la
organización y mantener un historial de lo que ocurre con cada recurso.

Con este sistema puedes:

- crear carpetas y subcarpetas;
- crear o subir archivos `.txt` y `.md`;
- leer y editar el contenido desde el navegador;
- compartir archivos y carpetas con permisos de lectura, edición o comentarios;
- destacar recursos para tenerlos a mano;
- consultar la actividad reciente y los recursos compartidos contigo;
- buscar recursos por nombre;
- recuperar elementos eliminados desde la papelera o borrarlos definitivamente;
- consultar y actualizar tus datos personales;
- si eres administrador, gestionar usuarios, revisar reportes y auditar la actividad.

Esta guía explica el uso de la interfaz. No es necesario conocer la API ni la base de
datos.

# 2. Requisitos y acceso

## 2.1 Requisitos

- Un navegador actualizado (Chrome, Edge, Firefox o similar).
- Conexión con el servidor donde está publicada la aplicación.
- Una cuenta activa proporcionada por el administrador o creada desde el registro.

En un entorno local, el frontend suele estar disponible en
`http://localhost:4200` y el backend en `http://localhost:3000`.

## 2.2 Cuentas de demostración

Si estás usando los datos de prueba del proyecto:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `ana@dms.local` | `password123` |
| Usuario | `carlos@dms.local` | `password123` |
| Usuario | `lucia@dms.local` | `password123` |

> Estas cuentas son solo para demostración. No deben usarse en un entorno real.

# 3. Inicio de sesión

1. Abre la aplicación. Si no hay una sesión activa, se mostrará la pantalla de acceso.
2. Escribe tu correo en **Nombre de usuario o correo**.
3. Escribe tu contraseña en **Contraseña**.
4. Pulsa **Iniciar sesión**.

![Pantalla de inicio de sesión](assets/01-inicio-sesion.png)

*Figura 1. Pantalla de acceso al sistema.*

Si el correo o la contraseña no son correctos, verás un mensaje de error. Si tu cuenta
está desactivada, el sistema no permitirá el acceso hasta que un administrador la
reactive.

## 3.1 Crear una cuenta

1. En la pantalla de acceso pulsa **Crear cuenta**.
2. Completa **Nombre**, **Correo**, **Contraseña** y **Confirmar contraseña**.
3. Revisa el indicador de seguridad de la contraseña.
4. Pulsa **Registrarse**.

El registro público siempre crea una cuenta con rol **Usuario**. Los permisos de
administrador solo se asignan desde el panel de administración. No hay recuperación
automática de contraseña: si la olvidas, contacta con un administrador.

# 4. Conocer la interfaz

Después de iniciar sesión verás una barra lateral y una barra superior.

![Vista principal de Mi Unidad](assets/02-mi-unidad-lista.png)

*Figura 2. Interfaz principal con la barra lateral y la barra de búsqueda.*

## 4.1 Barra lateral

| Elemento | Función |
|---|---|
| **Drive** | Colapsa o expande la barra lateral |
| **Nuevo** | Crea una carpeta, un archivo de texto, un archivo Markdown o sube un archivo |
| **Inicio** | Página inicial con carpetas y archivos recientes |
| **Mi Unidad** | Carpetas y archivos propios, además de carpetas compartidas |
| **Destacados** | Recursos que marcaste como importantes |
| **Recientes** | Últimos recursos sobre los que realizaste alguna acción |
| **Compartidos** | Recursos que otros usuarios compartieron directamente contigo |
| **Papelera** | Elementos eliminados que pueden restaurarse o borrarse definitivamente |
| **Administración** | Visible solo para administradores |

El administrador conserva el menú normal y además ve el bloque **Administración** con
**Dashboard**, **Usuarios**, **Reportes** y **Actividad**.

## 4.2 Barra superior

- **Buscar en Drive**: busca archivos y carpetas por nombre. Los resultados se agrupan
  en **Carpetas** y **Archivos**; al elegir uno se abre directamente.
- **Avatar**: abre el menú con **Mi perfil** y **Cerrar sesión**.

La búsqueda espera unos instantes después de la última pulsación, no distingue
mayúsculas y muestra una estrella en los recursos destacados.

## 4.3 Menú contextual de cada recurso

Cada carpeta o archivo tiene un botón de tres puntos **⋮**. También puedes hacer clic
con el botón derecho sobre la fila para abrir el mismo menú.

Las opciones disponibles dependen de tus permisos:

| Acción | Cuándo aparece |
|---|---|
| **Destacar** / **Quitar de destacados** | Siempre que tengas acceso al recurso |
| **Ver detalles** | Siempre que tengas acceso al recurso |
| **Renombrar** | Si eres propietario o tienes permiso de edición |
| **Mover a…** | Solo si eres propietario |
| **Compartir** | Solo si eres propietario |
| **Enviar a la papelera** | Solo si eres propietario |

En **Compartidos** nunca se ofrecen acciones de propietario, aunque el permiso recibido
sea de edición. En **Papelera** el menú solo muestra **Restaurar** y **Eliminar
permanentemente**.

## 4.4 Inicio, Recientes y Compartidos

**Inicio** es la página que aparece después de iniciar sesión. Muestra un saludo y dos
secciones:

- **Carpetas recientes**: las últimas carpetas que creaste o recibiste. El enlace
  **Ver todas** abre Mi Unidad.
- **Vistos recientemente**: los últimos archivos que abriste o sobre los que realizaste
  actividad. El enlace **Explorar** abre Mi Unidad.

**Recientes** reúne hasta 50 recursos únicos con su última acción. Puedes filtrar por
**Todo**, **Archivos** o **Carpetas**. Si un recurso se envió a la papelera o se eliminó
definitivamente, deja de aparecer.

**Compartidos** muestra los archivos y carpetas que otros usuarios compartieron
directamente contigo. Indica quién los compartió, el permiso recibido y la fecha. Los
recursos heredados dentro de una carpeta compartida se ven al entrar a esa carpeta,
pero no se listan aquí como comparticiones directas.

# 5. Mi Unidad

**Mi Unidad** muestra el contenido de tu carpeta raíz. Desde allí puedes entrar en las
subcarpetas y abrir los archivos.

## 5.1 Navegar por carpetas

1. Pulsa una carpeta para entrar.
2. Usa la flecha **←** de la cabecera para volver a la carpeta anterior.
3. La ruta bajo el título indica dónde estás, por ejemplo `Mi Unidad / Documentos`.

También verás carpetas que otros usuarios hayan compartido contigo. Su contenido se
abre igual que una carpeta propia, pero las acciones disponibles dependen del permiso
recibido.

## 5.2 Cambiar entre lista y cuadrícula

En la esquina superior derecha hay dos botones:

- **Vista de lista**: muestra una fila por recurso, con nombre, tipo y tamaño.
- **Vista de cuadrícula**: muestra tarjetas.

![Vista de cuadrícula](assets/03-mi-unidad-cuadricula.png)

*Figura 3. Vista de cuadrícula de Mi Unidad.*

La preferencia se guarda en el navegador y se mantiene en tus próximas visitas.

## 5.3 Contenido de una carpeta

![Contenido de una carpeta](assets/04-contenido-carpeta.png)

*Figura 4. Archivos y subcarpetas dentro de una carpeta.*

Las carpetas aparecen primero y los archivos después. Cada archivo muestra:

- un icono según el tipo (`TXT` o `MD`);
- su nombre;
- su tamaño en bytes, KB o MB.

Una estrella junto al nombre indica que el recurso está en **Destacados**. Las carpetas
compartidas contigo muestran la etiqueta **Compartida**.

En la cabecera también están el botón **Subir** y el selector de tipo de archivo.

## 5.4 Filtrar por tipo

Usa el selector **Tipo** para mostrar:

- **Todos**;
- **TXT**;
- **Markdown**.

El filtro se aplica a los archivos de la carpeta actual; las carpetas se siguen
mostrando.

# 6. Crear carpetas y archivos

## 6.1 Crear una carpeta

1. Entra en la carpeta donde quieres crearla o quédate en **Mi Unidad** para crearla
   en la raíz.
2. Pulsa **Nuevo** en la barra lateral.
3. Elige **Nueva carpeta**.
4. Escribe el nombre. El texto predeterminado es “Nueva carpeta”.
5. Pulsa **Crear**.

La carpeta aparece en la ubicación actual. No se permite repetir el nombre de otra
carpeta activa en la misma ubicación.

## 6.2 Crear un archivo de texto o Markdown

1. Entra en la carpeta de destino.
2. Pulsa **Nuevo**.
3. Elige **Nuevo archivo de texto** (`.txt`) o **Nuevo archivo de markdown** (`.md`).
4. Escribe el nombre **sin la extensión**. El sistema la añade automáticamente.
5. Pulsa **Crear**.

Al crear un archivo, se abre directamente el editor para que puedas escribir el
contenido. El nombre final incluye la extensión; por ejemplo, si escribes `informe` y
eligas Markdown, se guardará como `informe.md`.

> **Consejo:** no escribas `.md` o `.txt` en el campo de nombre, porque se añadiría
> otra vez y quedaría algo como `informe.md.md`.

## 6.3 Subir un archivo

1. Entra en la carpeta de destino dentro de **Mi Unidad**.
2. Pulsa **Subir** en la cabecera o elige **Subir archivo** en el menú **Nuevo**.
3. Selecciona un archivo `.txt` o `.md` de tu equipo.
4. El sistema crea el archivo con su contenido y muestra el aviso **Archivo subido**.

Reglas y limitaciones:

- solo se admiten archivos `.txt` y `.md`;
- el tamaño máximo es de 10 MB;
- no hay arrastrar y soltar, selección múltiple ni barra de progreso;
- si inicias la subida desde otra vista, el archivo se crea en la raíz de Mi Unidad.

# 7. Abrir y leer un archivo

Pulsa un archivo de la lista para abrirlo en el visor.

![Visor de un archivo Markdown](assets/05-visor-archivo.png)

*Figura 5. Visor con un archivo Markdown renderizado.*

El visor se adapta al tipo de archivo:

- **Markdown (`.md`)**: muestra el contenido renderizado, con títulos, listas, enlaces
  y bloques de código.
- **Texto plano (`.txt`)**: muestra el contenido tal cual, conservando espacios y
  saltos de línea.

En la cabecera verás el nombre, el tipo, el tamaño y el modo de visualización. Si
tienes permiso de edición, aparece el botón **Editar**.

# 8. Editar un archivo

1. Abre el archivo.
2. Pulsa **Editar** o entra desde la URL de edición.
3. Modifica el contenido en el área de texto.
4. Pulsa **Guardar**.

![Editor de archivos](assets/06-editor-archivo.png)

*Figura 6. Editor con el estado “Guardado”.*

Durante la edición:

- La cabecera indica **Guardado** o **Cambios sin guardar**.
- En archivos Markdown puedes alternar entre **Editar** y **Vista previa**.
- Puedes guardar con el botón **Guardar** o con **Ctrl+S** (Windows/Linux) o
  **Cmd+S** (macOS).
- Si intentas salir con cambios pendientes, el sistema pide confirmación.

El editor solo está disponible si tienes permiso de **edición** sobre el archivo. Si
solo tienes permiso de lectura o de comentarios, el botón **Editar** no aparece.

# 9. Compartir y permisos

Solo el propietario de un archivo o carpeta puede compartirlo.

## 9.1 Compartir un recurso

1. Abre el menú **⋮** del recurso.
2. Elige **Compartir**.
3. Busca a la persona por nombre o correo.
4. Selecciona el usuario.
5. Elige el permiso.
6. Pulsa **Compartir**.

![Diálogo para compartir](assets/07-compartir.png)

*Figura 7. Diálogo para compartir una carpeta.*

El buscador solo muestra usuarios que aún no tengan acceso directo al recurso. Para
cambiar el permiso de alguien que ya aparece en la lista, usa **Ver detalles**.

## 9.2 Niveles de permiso

| Permiso | Qué permite |
|---|---|
| **Lectura** | Ver, descargar y destacar el recurso |
| **Edición** | Ver, descargar, destacar y modificar el contenido o el nombre |
| **Comentarios** | Acceso de lectura y destacado; el módulo de comentarios aún no está incluido |

Aclaraciones importantes:

- Compartir y enviar a la papelera siguen siendo exclusivos del propietario, incluso
  si otra persona tiene permiso de edición.
- El permiso sobre una carpeta se hereda a su contenido, salvo que un archivo o
  subcarpeta tenga un permiso directo diferente.
- No puedes compartir contigo mismo.
- Solo puedes compartir con usuarios activos.

## 9.3 Consultar quién tiene acceso

En **Ver detalles** se muestra la lista de personas con acceso, su permiso y, cuando
corresponde, el origen del permiso (por ejemplo, herencia desde una carpeta).

Si eres el propietario, cada acceso directo incluye un selector para cambiar el nivel
de permiso sin salir de los detalles y un botón para retirarlo. Los accesos heredados
se cambian desde la carpeta de origen.

## 9.4 Destacar un recurso

1. Abre el menú **⋮** del archivo o carpeta.
2. Elige **Destacar**.
3. Para quitarlo, abre el mismo menú y elige **Quitar de destacados**.

El destacado es personal: no cambia la propiedad ni los permisos de otras personas.
Los recursos marcados aparecen en **Destacados** y muestran una estrella en Mi Unidad,
Inicio y la búsqueda. Si un recurso compartido deja de estar accesible, se descarta de
tu lista de destacados.

# 10. Renombrar y ver detalles

## 10.1 Renombrar

1. Abre el menú **⋮**.
2. Elige **Renombrar**.
3. Escribe el nuevo nombre.
4. Confirma.

Si renombras un archivo, conserva la extensión `.txt` o `.md` para que el visor y el
editor lo sigan tratando correctamente. No se permite un nombre duplicado en la misma
ubicación.

## 10.2 Ver detalles

La opción **Ver detalles** muestra:

- tipo de recurso;
- tamaño (en archivos);
- ubicación;
- cantidad de archivos y subcarpetas (en carpetas);
- fecha de creación y de última modificación;
- personas con acceso y su nivel de permiso;
- actividad reciente del recurso, con usuario, acción y fecha.

## 10.3 Mover un recurso

1. Abre el menú **⋮**.
2. Elige **Mover a…**.
3. Selecciona la carpeta de destino.
4. Confirma con **Mover**.

Solo el propietario puede mover. Si mueves una carpeta, también se mueve todo su
contenido. No puedes mover una carpeta dentro de sí misma ni de una de sus
subcarpetas. Los destinos de solo lectura aparecen bloqueados.

> **Importante:** si mueves un recurso a una carpeta compartida por otra persona, el
> recurso pasa a la unidad de esa persona. Si no conservas un permiso directo, dejarás
> de verlo. El diálogo lo advierte antes de confirmar.

# 11. Buscar en el sistema

1. Escribe al menos un carácter en **Buscar en Drive**.
2. Espera las sugerencias.
3. Pulsa un resultado para abrir la carpeta o el archivo.

La búsqueda:

- es parcial y no distingue mayúsculas;
- busca en recursos propios, compartidos directamente y dentro de carpetas
  compartidas;
- agrupa los resultados en **Carpetas** y **Archivos**;
- muestra un aviso cuando no hay coincidencias.

# 12. Papelera

Cuando envías un recurso a la papelera, no se borra de inmediato. Puedes recuperarlo
después.

![Papelera](assets/08-papelera.png)

*Figura 8. Papelera con carpetas y archivos eliminados.*

Puedes alternar entre **lista** y **cuadrícula** desde la cabecera. La preferencia se
guarda en el navegador y se mantiene en la siguiente visita.

## 12.1 Enviar a la papelera

1. Abre el menú **⋮** del recurso.
2. Elige **Enviar a la papelera**.
3. Confirma la acción.

Si envías una carpeta, también se envían a la papelera todos sus archivos y
subcarpetas. En la lista de la papelera solo aparece la carpeta que eliminaste, no
cada elemento interno.

## 12.2 Restaurar

1. Entra en **Papelera**.
2. Abre el menú **⋮** del recurso.
3. Elige **Restaurar**.

La restauración devuelve el recurso a su ubicación original. Si eliminaste una carpeta
completa, debes restaurar la carpeta; los elementos internos se recuperan con ella.

## 12.3 Eliminar permanentemente

1. Entra en **Papelera**.
2. Abre el menú **⋮** del recurso.
3. Elige **Eliminar permanentemente**.
4. Lee la advertencia y confirma.

La acción no se puede deshacer. Si el recurso es una carpeta, se eliminan también todos
sus archivos y subcarpetas. Solo puedes eliminar permanentemente la raíz de un envío;
si un archivo se envió a la papelera junto con su carpeta, primero debes eliminar la
carpeta.

## 12.4 Limitaciones

- Solo puedes ver, restaurar o eliminar permanentemente recursos propios.
- No se puede restaurar un recurso si su carpeta contenedora sigue en la papelera.
- No existe un botón para vaciar toda la papelera ni selección múltiple.
- Restaurar no pide confirmación; eliminar permanentemente sí.

# 13. Mi perfil

Pulsa tu avatar y elige **Mi perfil**.

![Mi perfil](assets/09-perfil.png)

*Figura 9. Datos personales y cambio de contraseña.*

## 13.1 Datos personales

Puedes cambiar:

- tu **nombre**;
- tu **correo**.

El rol y el estado de la cuenta los gestiona un administrador. Si el correo ya está
en uso por otra cuenta, el sistema mostrará un error.

## 13.2 Cambiar contraseña

1. Escribe tu contraseña actual.
2. Escribe la nueva contraseña (mínimo 6 caracteres).
3. Repite la nueva contraseña.
4. Pulsa **Actualizar contraseña**.

La nueva contraseña debe ser diferente a la actual. Si no recuerdas tu contraseña, no
hay un flujo de recuperación automática en esta versión: contacta con el
administrador.

# 14. Panel de administración

El bloque **Administración** solo aparece para usuarios con rol administrador. Incluye
cuatro secciones.

## 14.1 Dashboard

![Dashboard administrativo](assets/10-admin-dashboard.png)

*Figura 10. Resumen global del sistema.*

Muestra:

- total de archivos y carpetas;
- almacenamiento ocupado por archivos activos;
- cantidad de recursos compartidos;
- usuarios activos y totales;
- top de usuarios por cantidad de archivos;
- archivos más compartidos;
- actividad reciente.

## 14.2 Usuarios

![Gestión de usuarios](assets/11-admin-usuarios.png)

*Figura 11. Listado y administración de usuarios.*

Desde aquí el administrador puede:

- filtrar por rol y por estado;
- crear un usuario con nombre, correo, contraseña inicial y rol;
- editar nombre, correo y rol;
- desactivar una cuenta;
- reactivar una cuenta desactivada;
- consultar la fecha de registro.

Reglas de seguridad:

- un administrador no puede desactivar su propia cuenta;
- un administrador no puede cambiarse su propio rol;
- una cuenta desactivada no puede iniciar sesión;
- los cambios de rol se aplican sin esperar a que caduque la sesión.

## 14.3 Reportes

![Reportes globales](assets/12-admin-reportes.png)

*Figura 12. Reportes de archivos, usuarios, compartición y actividad.*

Los reportes se organizan en cuatro pestañas:

| Pestaña | Contenido |
|---|---|
| **Archivos** | Distribución por tipo, archivos por rango, archivos con más operaciones, archivos nunca compartidos y carpetas con más archivos |
| **Usuarios** | Top de usuarios por archivos y usuarios con más recursos compartidos |
| **Compartición** | Archivos con más acceso efectivo y detalle por usuario |
| **Actividad** | Operaciones globales por tipo y por período (día, mes o año) |

Detalles de la pestaña **Archivos**:

- **Archivos por rango** permite elegir **Desde** y **Hasta**, pulsar **Buscar** y
  limpiar el filtro con **Limpiar**. La tabla se pagina.
- **Archivos con más operaciones** es histórico: incluye archivos activos, en papelera
  y eliminados definitivamente.
- **Archivos nunca compartidos** muestra archivos activos sin compartición directa ni
  heredada.
- **Carpetas con más archivos** muestra el total del subárbol y el conteo directo.

En **Usuarios**, **Personas alcanzadas** cuenta usuarios únicos con acceso directo o
heredado, sin repetirlos. En **Compartición**, **Archivos con más acceso efectivo**
también incluye permisos heredados; **Detalle por usuario** muestra solo permisos
directos vigentes, separados en compartidos y recibidos.

En **Actividad**, **Operaciones por período** permite agrupar por día, mes o año.

## 14.4 Actividad del sistema

![Auditoría del sistema](assets/13-admin-actividad.png)

*Figura 13. Historial global de actividad.*

La auditoría permite filtrar por:

- usuario;
- acción;
- tipo de recurso;
- fecha desde y hasta.

La tabla muestra fecha, usuario, acción, recurso y un icono de información con los
detalles de la operación. Los resultados se pueden paginar.

Las acciones registradas incluyen creación, renombrado, movimiento, edición de
contenido, apertura de archivos, compartición, retiro de permisos, envío a papelera,
restauración, eliminación permanente, inicio de sesión, registro, actualización de
datos, desactivación y reactivación.

# 15. Preguntas frecuentes

## No puedo iniciar sesión

Comprueba el correo y la contraseña. Si son correctos, tu cuenta puede estar
desactivada; en ese caso un administrador debe reactivarla. También verifica que el
servidor esté disponible.

## La aplicación muestra un error de conexión

En un entorno local, comprueba que el backend esté ejecutándose en el puerto `3000` y
que el frontend use `http://localhost:4200`. El origen debe coincidir con la
configuración CORS del servidor; `127.0.0.1` y `localhost` no son equivalentes para
CORS.

## No veo el botón Editar

Solo aparece con permiso de **edición** o si eres el propietario. Con permiso de
**lectura** o **comentarios** el archivo es de solo lectura.

## No puedo compartir, mover ni eliminar

Esas acciones son exclusivas del propietario. Un permiso de edición permite modificar
el contenido y el nombre, pero no compartir, mover, enviar a la papelera ni eliminar
permanentemente.

## Ya existe una carpeta o archivo con ese nombre

Dentro de una misma ubicación no puede haber dos recursos activos con el mismo nombre.
Cambia el nombre o mueve el recurso a otra carpeta.

## El archivo es demasiado grande

Al subir, el límite es de 10 MB por archivo. Al crear o editar contenido, el máximo es
de 10 millones de caracteres y la petición HTTP tiene un límite de 16 MB. Divide el
documento o reduce su tamaño.

## ¿Puedo usar comentarios?

El nivel **Comentarios** existe al compartir, pero en esta versión solo concede acceso
de lectura. Todavía no hay un panel para publicar comentarios.

## ¿Cómo borro definitivamente un elemento?

Abre **Papelera**, usa el menú **⋮** del recurso y elige **Eliminar permanentemente**.
La acción no se puede deshacer y, si es una carpeta, elimina todo su contenido. Solo se
puede eliminar la raíz de un envío a la papelera.

## ¿Dónde están Recientes y Compartidos?

**Recientes** muestra los últimos recursos sobre los que actuaste. **Compartidos**
reúne los archivos y carpetas que otros usuarios compartieron directamente contigo.
Ambas vistas están disponibles en la barra lateral.

## ¿Puedo mover archivos o carpetas?

Sí. El propietario puede usar **Mover a…** en el menú contextual. Si mueves un recurso
a una carpeta compartida por otra persona, el recurso pasa a la unidad de esa persona y
puedes perder el acceso. No puedes mover una carpeta dentro de sí misma ni de una
subcarpeta.

## ¿Puedo subir varios archivos a la vez?

No. La carga es de un archivo por vez, solo `.txt` o `.md`, con un máximo de 10 MB.
Tampoco hay arrastrar y soltar ni barra de progreso.

## ¿Cómo quito un recurso de Destacados?

Abre su menú **⋮** y elige **Quitar de destacados**. La marca es personal y no afecta a
otros usuarios.

# 16. Glosario

| Término | Significado |
|---|---|
| **Archivo** | Documento `.txt` o `.md` almacenado en el sistema |
| **Carpeta** | Contenedor que puede incluir archivos y otras carpetas |
| **Mi Unidad** | Espacio personal desde el que se exploran los recursos |
| **Propietario** | Usuario dueño de un archivo o carpeta |
| **Permiso** | Nivel de acceso concedido a otro usuario |
| **Herencia** | Permiso de una carpeta que se aplica a su contenido |
| **Compartido directo** | Recurso compartido explícitamente con un usuario |
| **Destacado** | Marca personal para tener un recurso a mano |
| **Reciente** | Última acción registrada sobre un recurso |
| **Papelera** | Espacio temporal para recursos eliminados |
| **Raíz de papelera** | Recurso que originó un envío en cascada a la papelera |
| **Markdown** | Formato de texto con marcas para títulos, listas y código |
| **JWT** | Mecanismo de sesión usado por la aplicación |

---

**Sistema de Gestión Documental (DMS)** · Proyecto académico · CUNOC · 2026
