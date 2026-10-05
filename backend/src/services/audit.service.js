import { prisma } from '../config/prisma.js'

export const AuditActions = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
  EMPLOYEE_SERVICES_UPDATED: 'EMPLOYEE_SERVICES_UPDATED',
  SERVICE_CREATED: 'SERVICE_CREATED',
  SERVICE_UPDATED: 'SERVICE_UPDATED',
  SERVICE_STATUS_CHANGED: 'SERVICE_STATUS_CHANGED',
  SCHEDULE_CREATED: 'SCHEDULE_CREATED',
  SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
  APPOINTMENT_ACCEPTED: 'APPOINTMENT_ACCEPTED',
  APPOINTMENT_REJECTED: 'APPOINTMENT_REJECTED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_ATTENDED: 'APPOINTMENT_ATTENDED',
  APPOINTMENT_FINALIZED: 'APPOINTMENT_FINALIZED'
}

const sanitize = (metadata) => {
  if (!metadata) return null
  try {
    return JSON.parse(JSON.stringify(metadata))
  } catch {
    return null
  }
}

export const audit = ({ client, actorId, action, entityType, entityId, metadata }) => {
  const target = client || prisma
  return target.auditLog.create({ data: { actorId: actorId || null, action, entityType: entityType || null, entityId: entityId || null, metadata: sanitize(metadata) } }).catch(() => {})
}