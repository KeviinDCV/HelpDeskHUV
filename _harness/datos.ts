// Datos ficticios con la forma exacta de DashboardController::index().
// Categorías y servicios tomados de los más frecuentes en GLPI; los casos son inventados.
const hace = (min: number) => {
    const d = new Date(Date.now() - min * 60_000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

const PRIO: Record<number, string> = { 1: 'Muy baja', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Muy alta', 6: 'Urgente' };
const EST: Record<number, string> = { 1: 'Nuevo', 2: 'En curso (asignado)', 3: 'En curso (planificado)', 4: 'En espera', 5: 'Resuelto', 6: 'Cerrado' };

const caso = (id: number, name: string, desc: string, cat: string | null, priority: number, min: number, status = 1, area = 'Urgencias') => ({
    id, name, priority, status, category_name: cat,
    priority_name: PRIO[priority], status_name: EST[status],
    content: `${desc}\n\nTipo de equipo: Computador\n\n--- Datos del reportante ---\nNombre: Funcionario\nCargo: Auxiliar\nÁrea: ${area}`,
    date: hace(min), date_creation: hace(min), date_mod: hace(Math.max(1, min - 20)),
});

export const publicTickets = [
    caso(60214, 'Servinte no abre la historia clínica en Urgencias Adultos', 'Al intentar ingresar a Servinte Clínico aparece "error de conexión con el servidor" y no deja registrar la atención de los pacientes en triage.', 'Software > Servinte > Clinico', 6, 12, 1, 'Urgencias Adultos'),
    caso(60213, 'Impresora de manillas sin imprimir en Admisiones', 'La impresora Zebra de manillas de identificación no responde; el indicador parpadea en rojo y hay pacientes esperando.', 'Impresoras', 5, 38, 1, 'Admisiones'),
    caso(60211, 'Equipo bloqueado, no permite cerrar sesión', 'El computador de la estación de enfermería quedó bloqueado con la sesión de otro usuario y no deja ingresar.', 'Software > Cierre de Sesion - Desbloqueo Equipos', 4, 64, 1, 'Pediatría CE'),
    caso(60209, 'Sin red en consultorio 4 de Ortopedia', 'El equipo muestra "sin acceso a internet" desde la mañana; el cable de red parece estar bien conectado.', 'Redes', 4, 142, 1, 'Ortopedia'),
    caso(60206, 'Configurar escáner para digitalizar historias', 'Se requiere configurar el escáner del Archivo para guardar los documentos en la carpeta compartida.', 'Software > Configuracion Impresora > configuración de scaner', 3, 260, 1, 'Archivo de Historias Clínicas'),
    caso(60202, 'Teléfono IP sin tono en Sala de Operaciones', 'La extensión de la sala 3 no tiene tono desde ayer en la tarde.', 'Redes > Configuración Telefonia IP', 3, 1310, 1, 'Sala de Operaciones'),
];

export const myTickets = [
    caso(60198, 'Portátil no carga la batería', 'El portátil del coordinador no carga; ya se probó con otro cargador.', 'Hardware > Portatiles', 5, 190, 2, 'Trasplantes'),
    caso(60187, 'Correo institucional no sincroniza en Outlook', 'Los correos no llegan a Outlook desde el viernes, en la web sí aparecen.', 'Software > Correo', 4, 1500, 2, 'Subgerencia Financiera'),
    caso(60176, 'Mantenimiento preventivo equipos de Odontología', 'Programar mantenimiento preventivo de los 6 equipos del servicio.', 'Hardware > Mantenimiento > Preventivo', 3, 2900, 3, 'Odontología'),
    caso(60171, 'Actualizar página de citas web', 'Cambiar el horario de atención publicado en la página de citas.', 'Software > Paginas Institucionales > Pagina WEB', 3, 4300, 4, 'Comunicaciones'),
    caso(60165, 'Monitor con líneas en la pantalla', 'El monitor de la estación 2 muestra líneas verticales intermitentes.', 'Hardware > Equipos de Escritorio', 2, 7200, 2, 'Endoscopia'),
];

export const stats = { publicUnassigned: publicTickets.length, myTickets: 9, myPending: myTickets.length, myResolved: 412 };

export const technicians = [
    { id: 3, name: 'Andrés Castillo' }, { id: 4, name: 'Diana Mosquera' }, { id: 5, name: 'Jhon Fredy Ríos' }, { id: 6, name: 'Kevin Echavarría' },
];
