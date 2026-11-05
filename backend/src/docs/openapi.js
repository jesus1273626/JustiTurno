
const success = (schema) => ({
  description: 'Respuesta correcta.',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' }, examples: { success: { value: { success: true, data: schema } } } } }
})
const failure = (description = 'Error de validación o de autorización.') => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } })
const protectedOperation = (summary, extra = {}) => ({ ...extra, summary, security: [{ cookieAuth: [] }], responses: { 200: success({}), 401: failure('Sesión autenticada requerida.'), 403: failure('No tienes permiso para esta operación.'), ...(extra.responses || {}) } })
const protectedTag = (tag) => (summary, extra = {}) => protectedOperation(summary, { ...extra, tags: [tag] })
const authOperation = protectedTag('Auth')
const appointmentOperation = protectedTag('Citas')
const employeeOperation = protectedTag('Funcionario')
const adminOperation = protectedTag('Admin')
const notificationOperation = protectedTag('Notificaciones')
const body = (schema, example) => ({ required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` }, ...(example ? { example } : {}) } } })
const pathId = { id: { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Identificador de la cita.' } }

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'JustiTurno API',
    version: '1.0.0',
    description: 'API REST para la gestión de servicios, usuarios, funcionarios y citas de una Casa de Justicia.'
  },
  servers: [{ url: '/api/v1', description: 'API del mismo origen' }],
  tags: [
    { name: 'Health', description: 'Estado del servicio y de la base de datos.' },
    { name: 'Auth', description: 'Registro y sesión mediante cookie httpOnly.' },
    { name: 'Servicios', description: 'Catálogo público y disponibilidad.' },
    { name: 'Citas', description: 'Solicitudes gestionadas por ciudadanía.' },
    { name: 'Funcionario', description: 'Agenda y gestión operativa de citas.' },
    { name: 'Admin', description: 'Administración de la plataforma.' },
    { name: 'Notificaciones', description: 'Notificaciones del usuario autenticado.' }
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'justiturno_session', description: 'Cookie httpOnly creada con `/auth/login` o `/auth/register`. Swagger UI puede reutilizarla desde este mismo host.' }
    },
    schemas: {
      ApiResponse: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', example: true }, data: { nullable: true } } },
      ApiError: { type: 'object', required: ['success', 'error'], properties: { success: { type: 'boolean', example: false }, error: { type: 'object', properties: { message: { type: 'string', example: 'Sesión no autenticada.' }, requestId: { type: 'string', nullable: true } } } } },
      User: { type: 'object', properties: { id: { type: 'string' }, firstName: { type: 'string', example: 'María' }, lastName: { type: 'string', example: 'Rodríguez' }, document: { type: 'string', example: '1000000001' }, phone: { type: 'string', example: '3005551212' }, email: { type: 'string', format: 'email', example: 'ciudadano@demo.com' }, role: { type: 'string', enum: ['CITIZEN', 'EMPLOYEE', 'ADMIN'] }, active: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' } } },
      RegisterInput: { type: 'object', required: ['firstName', 'lastName', 'document', 'phone', 'email', 'password'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, document: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password', minLength: 8 } } },
      LoginInput: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'ciudadano@demo.com' }, password: { type: 'string', format: 'password', example: 'Demo1234' } } },
      Service: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string', example: 'orientacion-juridica' }, description: { type: 'string' }, category: { type: 'string' }, durationMinutes: { type: 'integer', example: 60 }, active: { type: 'boolean' } } },
      Appointment: { type: 'object', properties: { id: { type: 'string' }, code: { type: 'string', example: 'JT-000001' }, serviceId: { type: 'string' }, status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'RESCHEDULED', 'ATTENDED', 'FINALIZED', 'CANCELED'] }, date: { type: 'string', format: 'date', example: '2026-10-20' }, time: { type: 'string', example: '09:00' }, reason: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' } } },
      CreateAppointmentInput: { type: 'object', required: ['serviceId', 'date', 'time', 'reason'], properties: { serviceId: { type: 'string', example: 'SERVICE_ID' }, date: { type: 'string', format: 'date', example: '2026-10-20' }, time: { type: 'string', example: '09:00' }, reason: { type: 'string', minLength: 10, example: 'Requiero orientación inicial sobre mi caso.' } } },
      ReasonInput: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', minLength: 5, example: 'Se requiere ajustar la atención.' } } },
      RescheduleInput: { type: 'object', required: ['date', 'time', 'reason'], properties: { date: { type: 'string', format: 'date', example: '2026-10-20' }, time: { type: 'string', example: '10:00' }, reason: { type: 'string', minLength: 5, example: 'Se requiere ajustar el horario de atención.' } } },
      ObservationInput: { type: 'object', required: ['message'], properties: { message: { type: 'string', example: 'Presentarse con documento de identidad.' }, visibleToCitizen: { type: 'boolean', default: true } } },
      Notification: { type: 'object', properties: { id: { type: 'string' }, type: { type: 'string', example: 'APPOINTMENT_ACCEPTED' }, title: { type: 'string' }, message: { type: 'string' }, entityType: { type: 'string', nullable: true }, entityId: { type: 'string', nullable: true }, readAt: { type: 'string', format: 'date-time', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } }
    }
  },
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Estado básico de la API', responses: { 200: success({ status: 'ok', service: 'justiturno-api' }) } } },
    '/health/db': { get: { tags: ['Health'], summary: 'Comprueba la conexión a PostgreSQL', responses: { 200: success({ status: 'ok', database: 'connected' }), 503: failure('Base de datos no disponible.') } } },
    '/health/ready': { get: { tags: ['Health'], summary: 'Readiness para despliegues', responses: { 200: success({ status: 'ready', database: 'connected' }), 503: failure('Servicio no listo.') } } },
    '/auth/register': { post: { tags: ['Auth'], summary: 'Registra una persona ciudadana e inicia sesión', requestBody: body('RegisterInput'), responses: { 201: success({ user: { $ref: '#/components/schemas/User' } }), 409: failure('Correo o documento ya registrado.') } } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Inicia sesión y establece la cookie httpOnly', requestBody: body('LoginInput'), responses: { 200: success({ user: { $ref: '#/components/schemas/User' } }), 401: failure('Credenciales inválidas.') } } },
    '/auth/logout': { post: authOperation('Cierra la sesión actual') },
    '/auth/logout-all': { post: authOperation('Cierra todas las sesiones activas') },
    '/auth/me': { get: authOperation('Obtiene el usuario de la sesión actual') },
    '/services': { get: { tags: ['Servicios'], summary: 'Lista servicios públicos activos', responses: { 200: success([{ $ref: '#/components/schemas/Service' }]) } } },
    '/services/{slug}': { get: { tags: ['Servicios'], summary: 'Detalle de un servicio', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: success({ $ref: '#/components/schemas/Service' }), 404: failure('Servicio no encontrado.') } } },
    '/services/{slug}/availability': { get: { tags: ['Servicios'], summary: 'Disponibilidad por fecha', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }, { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-10-20' }], responses: { 200: success({ date: '2026-10-20', slots: [] }), 400: failure('Fecha inválida.') } } },
    '/appointments': { post: { tags: ['Citas'], summary: 'Crea una cita ciudadana', security: [{ cookieAuth: [] }], requestBody: body('CreateAppointmentInput'), responses: { 201: success({ $ref: '#/components/schemas/Appointment' }), 401: failure(), 403: failure('Solo ciudadanía puede crear citas.'), 409: failure('Horario no disponible.') } } },
    '/appointments/my': { get: appointmentOperation('Lista las citas de la ciudadanía autenticada') },
    '/appointments/{id}': { get: appointmentOperation('Obtiene el detalle de una cita', { parameters: [pathId.id] }) },
    '/appointments/{id}/cancel': { patch: appointmentOperation('Cancela una cita propia', { parameters: [pathId.id], responses: { 200: success({ $ref: '#/components/schemas/Appointment' }), 409: failure('La cita no puede cancelarse.') } }) },
    '/employee/dashboard': { get: employeeOperation('Resumen operativo del funcionario o administrador') },
    '/employee/agenda': { get: employeeOperation('Agenda diaria asignada', { parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }] }) },
    '/employee/appointments': { get: employeeOperation('Lista citas que puede atender') },
    '/employee/appointments/{id}/accept': { patch: employeeOperation('Acepta y asigna una cita', { parameters: [pathId.id] }) },
    '/employee/appointments/{id}/reject': { patch: employeeOperation('Rechaza una cita', { parameters: [pathId.id], requestBody: body('ReasonInput') }) },
    '/employee/appointments/{id}/reschedule': { patch: employeeOperation('Reprograma una cita', { parameters: [pathId.id], requestBody: body('RescheduleInput') }) },
    '/employee/appointments/{id}/observations': { post: employeeOperation('Agrega una observación', { parameters: [pathId.id], requestBody: body('ObservationInput'), responses: { 201: success({ $ref: '#/components/schemas/Appointment' }) } }) },
    '/employee/appointments/{id}/attend': { patch: employeeOperation('Marca una cita como atendida', { parameters: [pathId.id] }) },
    '/employee/appointments/{id}/finalize': { patch: employeeOperation('Finaliza una cita', { parameters: [pathId.id] }) },
    '/admin/dashboard': { get: adminOperation('Métricas del panel administrativo') },
    '/admin/users': { get: adminOperation('Lista usuarios') },
    '/admin/employees': { get: adminOperation('Lista funcionarios') },
    '/admin/services': { get: adminOperation('Lista servicios administrables') },
    '/admin/schedules': { get: adminOperation('Lista horarios') },
    '/admin/appointments': { get: adminOperation('Lista y filtra citas') },
    '/admin/audit': { get: adminOperation('Consulta auditoría') },
    '/admin/reports/appointments': { get: adminOperation('Reporte consolidado de citas') },
    '/notifications': { get: notificationOperation('Lista notificaciones propias') },
    '/notifications/unread-count': { get: notificationOperation('Cuenta notificaciones no leídas') },
    '/notifications/{id}/read': { patch: notificationOperation('Marca una notificación como leída', { parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }) },
    '/notifications/read-all': { patch: notificationOperation('Marca todas las notificaciones como leídas') }
  }
}

export const openapiSpec = definition
