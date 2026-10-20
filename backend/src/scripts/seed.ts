// src/scripts/seed.ts
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { env } from '../shared/config/env';
import { ActividadModel } from '../modules/actividad/actividad.model';
import { UsuarioModel } from '../modules/usuario/usuario.model';
import { CarpetaModel } from '../modules/carpeta/carpeta.model';
import { ArchivoModel, IArchivo } from '../modules/archivo/archivo.model';
import { connectDB, disconnectDB } from '../shared/config/db';
import { Types } from 'mongoose';
import {
    AccionActividad,
    ExtensionArchivo,
    NivelPermiso,
    Rol,
    TipoRecurso,
} from '../shared/types/enums';

// ============================================================
// Utilidades
// ============================================================

/** Genera una fecha aleatoria entre hace N días y ahora */
const fechaAleatoria = (diasAtras: number): Date => {
    const ahora = Date.now();
    const hace = ahora - diasAtras * 24 * 60 * 60 * 1000;
    return new Date(hace + Math.random() * (ahora - hace));
};

/** Elige un elemento aleatorio de un array */
const aleatorio = <T>(arr: readonly T[] | T[]): T => {
    const item = arr[Math.floor(Math.random() * arr.length)];
    if (item === undefined) {
        throw new Error('Array vacío');
    }
    return item;
};

/** Entero aleatorio entre min y max (inclusive) */
const enteroAleatorio = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// ============================================================
// Datos base
// ============================================================

const NOMBRES_ARCHIVOS_TXT = [
    'notas-reunion',
    'acta-consejo',
    'presupuesto-q1',
    'presupuesto-q2',
    'lista-tareas',
    'contactos-clientes',
    'plan-marketing',
    'informe-ventas',
    'borrador-propuesta',
    'minuta-llamada',
    'checklist-onboarding',
    'resumen-ejecutivo',
    'politica-privacidad',
    'terminos-servicio',
    'manual-empleado',
    'plan-vacaciones',
    'reporte-gastos',
    'inventario-equipos',
    'registro-proveedores',
    'cronograma-proyecto',
];

const NOMBRES_ARCHIVOS_MD = [
    'readme-proyecto',
    'guia-instalacion',
    'documentacion-api',
    'arquitectura-sistema',
    'changelog',
    'contributing',
    'roadmap',
    'decisiones-tecnicas',
    'manual-usuario',
    'troubleshooting',
    'glosario-terminos',
    'referencia-rapida',
    'guia-estilos',
    'plan-pruebas',
    'onboarding-developers',
];

const CONTENIDOS_TXT = [
    'Reunión del equipo de desarrollo\nFecha: 2026-10-15\nAsistentes: Juan, María, Pedro\n\nTemas tratados:\n1. Avance del proyecto\n2. Bloqueos identificados\n3. Próximos pasos',
    'Presupuesto trimestral\n\nIngresos: $50,000\nGastos: $32,500\nUtilidad: $17,500\n\nObservaciones: se mantiene la proyección inicial.',
    'Lista de tareas pendientes\n\n[x] Configurar entorno\n[x] Diseñar modelo de datos\n[ ] Implementar autenticación\n[ ] Escribir pruebas\n[ ] Desplegar',
    'Acta de la reunión del consejo\n\nSe aprobó por unanimidad la propuesta presentada por el comité financiero. Próxima sesión: 30 de octubre.',
    'Informe de ventas del mes\n\nVentas totales: 142 unidades\nIngresos: $28,400\nClientes nuevos: 12\nTasa de conversión: 8.5%',
];

const CONTENIDOS_MD = [
    '# Proyecto DMS\n\nSistema de Gestión Documental.\n\n## Instalación\n\n```bash\nnpm install\nnpm run dev\n```\n\n## Stack\n\n- Angular 21\n- Node.js + Express\n- MongoDB',
    '# Guía de contribución\n\n## Flujo de trabajo\n\n1. Fork del repositorio\n2. Crear rama feature\n3. Pull request\n\n## Estándares\n\n- Commits semánticos\n- Cobertura de tests > 80%',
    '# Documentación de API\n\n## Endpoints\n\n### POST /api/auth/login\n\n```json\n{ "correo": "user@example.com", "password": "..." }\n```\n\n### GET /api/archivos\n\nRequiere header `Authorization: Bearer <token>`.',
    '# Arquitectura del sistema\n\n## Capas\n\n- **Cliente:** Angular 21\n- **Servidor:** Express + TypeScript\n- **Base de datos:** MongoDB\n\n## Patrones aplicados\n\n- Repository\n- Dependency Injection\n- Service Layer',
    '# Roadmap\n\n## Q4 2026\n\n- [x] MVP de gestión documental\n- [ ] Integración con almacenamiento externo\n- [ ] Notificaciones en tiempo real\n\n## Q1 2027\n\n- Análisis de documentos con IA\n- Firma electrónica',
];

// ============================================================
// Seed principal
// ============================================================

const seed = async (): Promise<void> => {
    await connectDB(env.MONGO_URI);

    console.log('\n🌱 Iniciando seed...\n');

    // 1. Limpiar colecciones
    console.log('🧹 Limpiando colecciones...');
    await Promise.all([
        UsuarioModel.deleteMany({}),
        CarpetaModel.deleteMany({}),
        ArchivoModel.deleteMany({}),
        ActividadModel.deleteMany({}),
    ]);
    console.log('   ✓ Colecciones limpias');

    // 2. Crear usuarios
    console.log('\n👥 Creando usuarios...');
    const passwordHash = await bcrypt.hash('password123', env.BCRYPT_ROUNDS);

    const usuarios = await UsuarioModel.insertMany([
        {
            nombre: 'Ana Martínez',
            correo: 'ana@dms.local',
            passwordHash,
            rol: Rol.Administrador,
            activo: true,
        },
        {
            nombre: 'Carlos Gómez',
            correo: 'carlos@dms.local',
            passwordHash,
            rol: Rol.Usuario,
            activo: true,
        },
        {
            nombre: 'Lucía Fernández',
            correo: 'lucia@dms.local',
            passwordHash,
            rol: Rol.Usuario,
            activo: true,
        },
    ]);

    const [ana, carlos, lucia] = usuarios;
    if (!ana || !carlos || !lucia) {
        throw new Error('No se pudieron crear los usuarios iniciales');
    }

    console.log(
        `   ✓ ${usuarios.length} usuarios creados (password: "password123")`,
    );

    // 3. Crear estructura de carpetas
    console.log('\n📁 Creando carpetas...');

    // Carpetas raíz de cada usuario
    const raices = await CarpetaModel.insertMany([
        {
            nombre: 'Documentos',
            propietario: ana._id,
            carpetaPadre: null,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(85),
            updatedAt: fechaAleatoria(20),
        },
        {
            nombre: 'Proyectos',
            propietario: ana._id,
            carpetaPadre: null,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(80),
            updatedAt: fechaAleatoria(15),
        },
        {
            nombre: 'Personal',
            propietario: carlos._id,
            carpetaPadre: null,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(55),
            updatedAt: fechaAleatoria(10),
        },
        {
            nombre: 'Trabajo',
            propietario: carlos._id,
            carpetaPadre: null,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(50),
            updatedAt: fechaAleatoria(5),
        },
        {
            nombre: 'Apuntes',
            propietario: lucia._id,
            carpetaPadre: null,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(40),
            updatedAt: fechaAleatoria(8),
        },
    ].map((c) => ({ ...c, creadoPor: c.propietario })));

    const [docsAna, proyAna, persCarlos, trabCarlos, apuntesLucia] = raices;
    if (!docsAna || !proyAna || !persCarlos || !trabCarlos || !apuntesLucia) {
        throw new Error('Error al crear las carpetas raíces');
    }

    // Subcarpetas nivel 2
    const nivel2 = await CarpetaModel.insertMany([
        {
            nombre: 'Contratos',
            propietario: ana._id,
            carpetaPadre: docsAna._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(70),
            updatedAt: fechaAleatoria(20),
        },
        {
            nombre: 'Facturas',
            propietario: ana._id,
            carpetaPadre: docsAna._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(70),
            updatedAt: fechaAleatoria(20),
        },
        {
            nombre: 'DMS',
            propietario: ana._id,
            carpetaPadre: proyAna._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(65),
            updatedAt: fechaAleatoria(3),
        },
        {
            nombre: 'Recibos',
            propietario: carlos._id,
            carpetaPadre: persCarlos._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(45),
            updatedAt: fechaAleatoria(10),
        },
        {
            nombre: 'Reportes',
            propietario: carlos._id,
            carpetaPadre: trabCarlos._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(40),
            updatedAt: fechaAleatoria(6),
        },
        {
            nombre: 'Universidad',
            propietario: lucia._id,
            carpetaPadre: apuntesLucia._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(35),
            updatedAt: fechaAleatoria(2),
        },
    ].map((c) => ({ ...c, creadoPor: c.propietario })));

    const [contratos, facturas, dms, recibos, reportes, universidad] = nivel2;
    if (
        !contratos ||
        !facturas ||
        !dms ||
        !recibos ||
        !reportes ||
        !universidad
    ) {
        throw new Error('Error al crear las carpetas de nivel 2');
    }

    // Subcarpetas nivel 3
    const nivel3 = await CarpetaModel.insertMany([
        {
            nombre: '2026',
            propietario: ana._id,
            carpetaPadre: contratos._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(60),
            updatedAt: fechaAleatoria(10),
        },
        {
            nombre: 'Backend',
            propietario: ana._id,
            carpetaPadre: dms._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(60),
            updatedAt: fechaAleatoria(2),
        },
        {
            nombre: 'Frontend',
            propietario: ana._id,
            carpetaPadre: dms._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(60),
            updatedAt: fechaAleatoria(2),
        },
        {
            nombre: 'Semestre-1',
            propietario: lucia._id,
            carpetaPadre: universidad._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(30),
            updatedAt: fechaAleatoria(5),
        },
        {
            nombre: 'Semestre-2',
            propietario: lucia._id,
            carpetaPadre: universidad._id,
            compartidoCon: [],
            enPapelera: false,
            fechaEnvioPapelera: null,
            createdAt: fechaAleatoria(20),
            updatedAt: fechaAleatoria(3),
        },
    ].map((c) => ({ ...c, creadoPor: c.propietario })));

    const [contratos2026, backend, frontend, sem1, sem2] = nivel3;
    if (!contratos2026 || !backend || !frontend || !sem1 || !sem2) {
        throw new Error('Error al crear las carpetas de nivel 3');
    }

    const todasLasCarpetas = [...raices, ...nivel2, ...nivel3];
    console.log(`   ✓ ${todasLasCarpetas.length} carpetas creadas`);

    // 4. Crear archivos (50 en total)
    console.log('\n📄 Creando archivos...');

    const archivosData: Record<string, unknown>[] = [];

    // Distribución de carpetas destino para archivos
    const destinos = [
        { carpeta: docsAna._id, propietario: ana._id, cantidad: 6 },
        { carpeta: contratos._id, propietario: ana._id, cantidad: 4 },
        { carpeta: contratos2026._id, propietario: ana._id, cantidad: 3 },
        { carpeta: facturas._id, propietario: ana._id, cantidad: 4 },
        { carpeta: dms._id, propietario: ana._id, cantidad: 5 },
        { carpeta: backend._id, propietario: ana._id, cantidad: 4 },
        { carpeta: frontend._id, propietario: ana._id, cantidad: 3 },
        { carpeta: persCarlos._id, propietario: carlos._id, cantidad: 4 },
        { carpeta: recibos._id, propietario: carlos._id, cantidad: 3 },
        { carpeta: trabCarlos._id, propietario: carlos._id, cantidad: 3 },
        { carpeta: reportes._id, propietario: carlos._id, cantidad: 4 },
        { carpeta: apuntesLucia._id, propietario: lucia._id, cantidad: 3 },
        { carpeta: universidad._id, propietario: lucia._id, cantidad: 2 },
        { carpeta: sem1._id, propietario: lucia._id, cantidad: 2 },
        { carpeta: sem2._id, propietario: lucia._id, cantidad: 2 },
    ];

    // Contador por propietario+carpeta para nombres únicos
    const usados = new Set<string>();

    for (const destino of destinos) {
        for (let i = 0; i < destino.cantidad; i++) {
            const esMd = Math.random() < 0.4;
            const tipo = esMd ? ExtensionArchivo.Md : ExtensionArchivo.Txt;

            let nombre = '';
            let intentos = 0;
            do {
                const base = esMd
                    ? aleatorio(NOMBRES_ARCHIVOS_MD)
                    : aleatorio(NOMBRES_ARCHIVOS_TXT);
                nombre = `${base}-${enteroAleatorio(1, 999)}.${tipo}`;
                intentos++;
            } while (
                usados.has(`${destino.carpeta.toString()}:${nombre}`) &&
                intentos < 20
            );
            usados.add(`${destino.carpeta.toString()}:${nombre}`);

            const contenido = esMd
                ? aleatorio(CONTENIDOS_MD)
                : aleatorio(CONTENIDOS_TXT);
            const tamanio = Buffer.byteLength(contenido, 'utf8');
            const fecha = fechaAleatoria(60);

            archivosData.push({
                nombre,
                tipo,
                contenido,
                tamanio,
                propietario: destino.propietario,
                carpetaPadre: destino.carpeta,
                compartidoCon: [],
                enPapelera: false,
                fechaEnvioPapelera: null,
                createdAt: fecha,
                updatedAt: fecha,
            });
        }
    }

    const archivos = (await ArchivoModel.insertMany(
        archivosData.map((a) => ({ ...a, creadoPor: a.propietario })),
    )) as unknown as IArchivo[];
    console.log(`   ✓ ${archivos.length} archivos creados`);

    // 5. Compartidos (20+)
    console.log('\n🤝 Creando compartidos...');

    let compartidosCreados = 0;
    const operacionesCompartir: {
        usuarioId: string;
        recursoId: string;
        tipo: TipoRecurso;
        nombre: string;
        destinoId: string;
        permiso: NivelPermiso;
        fecha: Date;
    }[] = [];

    // Compartir carpetas de Ana con Carlos y Lucía
    const bulkCarpetas: any[] = [];

    for (const carpeta of [
        docsAna,
        proyAna,
        contratos,
        facturas,
        dms,
        backend,
    ]) {
        const posiblesDestinos = [carlos, lucia].filter(
            () => Math.random() < 0.7,
        );
        for (const destino of posiblesDestinos) {
            const permiso = aleatorio([
                NivelPermiso.Lectura,
                NivelPermiso.Escritura,
                NivelPermiso.Comentar,
            ]);
            bulkCarpetas.push({
                updateOne: {
                    filter: { _id: carpeta._id },
                    update: {
                        $push: {
                            compartidoCon: {
                                usuario: destino._id,
                                permiso,
                                fechaCompartido: fechaAleatoria(30),
                            },
                        },
                    },
                },
            });
            operacionesCompartir.push({
                usuarioId: ana._id.toString(),
                recursoId: carpeta._id.toString(),
                tipo: TipoRecurso.Carpeta,
                nombre: carpeta.nombre,
                destinoId: destino._id.toString(),
                permiso,
                fecha: fechaAleatoria(30),
            });
            compartidosCreados++;
        }
    }

    // Compartir carpetas de Carlos con Ana
    for (const carpeta of [trabCarlos, reportes]) {
        const permiso = aleatorio([
            NivelPermiso.Lectura,
            NivelPermiso.Escritura,
        ]);
        bulkCarpetas.push({
            updateOne: {
                filter: { _id: carpeta._id },
                update: {
                    $push: {
                        compartidoCon: {
                            usuario: ana._id,
                            permiso,
                            fechaCompartido: fechaAleatoria(25),
                        },
                    },
                },
            },
        });
        operacionesCompartir.push({
            usuarioId: carlos._id.toString(),
            recursoId: carpeta._id.toString(),
            tipo: TipoRecurso.Carpeta,
            nombre: carpeta.nombre,
            destinoId: ana._id.toString(),
            permiso,
            fecha: fechaAleatoria(25),
        });
        compartidosCreados++;
    }

    if (bulkCarpetas.length > 0) {
        await CarpetaModel.bulkWrite(bulkCarpetas);
    }

    // Compartir algunos archivos directamente
    const archivosACompartir = archivos.slice(0, 15);
    const bulkArchivos: any[] = [];

    for (const archivo of archivosACompartir) {
        const propietario = archivo.propietario.toString();
        const posibles = [ana, carlos, lucia].filter(
            (u) => u._id.toString() !== propietario,
        );
        const destino = aleatorio(posibles);
        const permiso = aleatorio([
            NivelPermiso.Lectura,
            NivelPermiso.Escritura,
            NivelPermiso.Comentar,
        ]);

        bulkArchivos.push({
            updateOne: {
                filter: { _id: archivo._id },
                update: {
                    $push: {
                        compartidoCon: {
                            usuario: destino._id,
                            permiso,
                            fechaCompartido: fechaAleatoria(20),
                        },
                    },
                },
            },
        });
        operacionesCompartir.push({
            usuarioId: propietario,
            recursoId: archivo._id.toString(),
            tipo: TipoRecurso.Archivo,
            nombre: archivo.nombre,
            destinoId: destino._id.toString(),
            permiso,
            fecha: fechaAleatoria(20),
        });
        compartidosCreados++;
    }

    if (bulkArchivos.length > 0) {
        await ArchivoModel.bulkWrite(bulkArchivos);
    }

    console.log(`   ✓ ${compartidosCreados} operaciones de compartición`);

    // 6. Enviar algunos recursos a papelera
    console.log('\n🗑️  Enviando recursos a papelera...');

    const archivosAPapelera = archivos.slice(15, 20); // 5 archivos
    await ArchivoModel.updateMany(
        { _id: { $in: archivosAPapelera.map((a) => a._id) } },
        [
            {
                $set: {
                    enPapelera: true,
                    fechaEnvioPapelera: fechaAleatoria(10),
                    papeleraRaiz: '$_id',
                },
            },
        ],
        { updatePipeline: true },
    );

    // 1 carpeta a papelera (sin hijos)
    const carpetaAPapelera = sem2;
    await CarpetaModel.updateOne(
        { _id: carpetaAPapelera._id },
        [
            {
                $set: {
                    enPapelera: true,
                    fechaEnvioPapelera: fechaAleatoria(8),
                    papeleraRaiz: '$_id',
                },
            },
        ],
        { updatePipeline: true },
    );

    console.log(`   ✓ 5 archivos y 1 carpeta en papelera`);

    // 7. Historial de actividad
    console.log('\n📜 Generando historial de actividad...');

    const actividades: Record<string, unknown>[] = [];

    // Actividades de creación de carpetas
    for (const carpeta of todasLasCarpetas) {
        const u = usuarios.find(
            (usr) => usr._id.toString() === carpeta.propietario.toString(),
        );
        if (!u) continue;

        actividades.push({
            usuario: carpeta.propietario,
            usuarioNombre: u.nombre,
            usuarioCorreo: u.correo,
            accion: AccionActividad.Crear,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: carpeta._id,
            recursoNombre: carpeta.nombre,
            metadata: {
                carpetaPadre: carpeta.carpetaPadre?.toString() ?? null,
            },
            createdAt: carpeta.createdAt,
        });
    }

    // Actividades de creación de archivos
    for (const archivo of archivos) {
        const u = usuarios.find(
            (x) => x._id.toString() === archivo.propietario.toString(),
        );
        if (!u) continue;

        actividades.push({
            usuario: archivo.propietario,
            usuarioNombre: u.nombre,
            usuarioCorreo: u.correo,
            accion: AccionActividad.Crear,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: archivo._id,
            recursoNombre: archivo.nombre,
            metadata: { tipo: archivo.tipo, tamanio: archivo.tamanio },
            createdAt: archivo.createdAt,
        });
    }

    // Actividades de compartir
    for (const op of operacionesCompartir) {
        const u = usuarios.find((x) => x._id.toString() === op.usuarioId);
        if (!u) continue;

        actividades.push({
            usuario: new Types.ObjectId(op.usuarioId),
            usuarioNombre: u.nombre,
            usuarioCorreo: u.correo,
            accion: AccionActividad.Compartir,
            recursoTipo: op.tipo,
            recursoId: new Types.ObjectId(op.recursoId),
            recursoNombre: op.nombre,
            metadata: { usuarioDestino: op.destinoId, permiso: op.permiso },
            createdAt: op.fecha,
        });
    }

    // Actividades de envío a papelera
    for (const archivo of archivosAPapelera) {
        const u = usuarios.find(
            (x) => x._id.toString() === archivo.propietario.toString(),
        );
        if (!u) continue;

        actividades.push({
            usuario: archivo.propietario,
            usuarioNombre: u.nombre,
            usuarioCorreo: u.correo,
            accion: AccionActividad.EnviarPapelera,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: archivo._id,
            recursoNombre: archivo.nombre,
            metadata: {},
            createdAt: fechaAleatoria(10),
        });
    }

    // Logins simulados
    for (const usuario of usuarios) {
        const numLogins = enteroAleatorio(8, 15);
        for (let i = 0; i < numLogins; i++) {
            actividades.push({
                usuario: usuario._id,
                usuarioNombre: usuario.nombre,
                usuarioCorreo: usuario.correo,
                accion: AccionActividad.Login,
                recursoTipo: TipoRecurso.Usuario,
                recursoId: usuario._id,
                recursoNombre: usuario.nombre,
                metadata: {},
                createdAt: fechaAleatoria(45),
            });
        }
    }

    // Algunas actualizaciones de contenido
    const archivosActualizados = archivos.slice(20, 28);
    for (const archivo of archivosActualizados) {
        const u = usuarios.find(
            (x) => x._id.toString() === archivo.propietario.toString(),
        );
        if (!u) continue;

        actividades.push({
            usuario: archivo.propietario,
            usuarioNombre: u.nombre,
            usuarioCorreo: u.correo,
            accion: AccionActividad.ActualizarContenido,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: archivo._id,
            recursoNombre: archivo.nombre,
            metadata: {
                tamanioAnterior: archivo.tamanio,
                tamanioNuevo: archivo.tamanio + enteroAleatorio(-50, 200),
            },
            createdAt: fechaAleatoria(15),
        });
    }

    // Ordenar por fecha y guardar
    actividades.sort(
        (a, b) =>
            (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime(),
    );
    await ActividadModel.insertMany(actividades);

    console.log(`   ✓ ${actividades.length} registros de actividad`);

    // 8. Resumen final
    console.log('\n📊 Resumen del seed:');
    console.log(`   Usuarios:    ${usuarios.length}`);
    console.log(`   Carpetas:    ${todasLasCarpetas.length}`);
    console.log(`   Archivos:    ${archivos.length}`);
    console.log(`   Compartidos: ${compartidosCreados}`);
    console.log(`   En papelera: ${archivosAPapelera.length + 1}`);
    console.log(`   Actividades: ${actividades.length}`);
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   📧 ana@dms.local     / password123 (administrador)');
    console.log('   📧 carlos@dms.local  / password123 (usuario)');
    console.log('   📧 lucia@dms.local   / password123 (usuario)');
    console.log('\n✅ Seed completado\n');

    await disconnectDB();
    process.exit(0);
};

seed().catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
});
