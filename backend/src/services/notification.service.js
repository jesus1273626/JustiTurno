import { localDate, localTime } from '../utils/dates.js'

export const createNotification = (client, data) => client.notification.create({ data })

const stateCopy = (status, appointment) => {
  const when = `${localDate(appointment.scheduledAt)} a las ${localTime(appointment.scheduledAt)}`
  const copies = {
    PENDING: ['Solicitud registrada', `Tu solicitud ${appointment.code} fue registrada correctamente.`],
    ACCEPTED: ['Cita aceptada', `Tu cita ${appointment.code} fue aceptada.`],
    REJECTED: ['Cita rechazada', `Tu cita ${appointment.code} fue rechazada. ${appointment.reason || ''}`],
    RESCHEDULED: ['Cita reprogramada', `Tu cita ${appointment.code} fue reprogramada para ${when}.`],
    CANCELED: ['Cita cancelada', `Tu cita ${appointment.code} fue cancelada.`],
    ATTENDED: ['Cita atendida', `Tu cita ${appointment.code} fue marcada como atendida.`],
    FINALIZED: ['Cita finalizada', `Tu cita ${appointment.code} fue finalizada.`]
  }
  return copies[status]
}

export const notifyAppointmentState = async (client, appointment, status, message) => {
  const [title, defaultMessage] = stateCopy(status, appointment)
  const type = status === 'PENDING' ? 'APPOINTMENT_CREATED' : `APPOINTMENT_${status}`
  return createNotification(client, { userId: appointment.citizenId, type, title, message: message || defaultMessage, entityType: 'appointment', entityId: appointment.id })
}

export const notifyObservation = (client, appointment, message) => createNotification(client, { userId: appointment.citizenId, type: 'APPOINTMENT_OBSERVATION', title: 'Nueva observación', message: `Tienes una nueva observación en la cita ${appointment.code}: ${message}`, entityType: 'appointment', entityId: appointment.id })
export const notifyAccountStatus = (client, user, active) => createNotification(client, {
  userId: user.id,
  type: 'ACCOUNT_STATUS_CHANGED',
  title: active ? 'Cuenta activada' : 'Cuenta desactivada',
  message: active ? 'Tu cuenta fue activada y ya puedes ingresar a JustiTurno.' : 'Tu cuenta fue desactivada. Comunícate con la Casa de Justicia si necesitas ayuda.',
  entityType: 'user',
  entityId: user.id
})
