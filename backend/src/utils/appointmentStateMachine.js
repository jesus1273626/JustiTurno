const transitions = {
  PENDING: ['ACCEPTED', 'REJECTED', 'RESCHEDULED', 'CANCELED'],
  ACCEPTED: ['RESCHEDULED', 'ATTENDED', 'CANCELED'],
  RESCHEDULED: ['ACCEPTED', 'ATTENDED', 'CANCELED'],
  ATTENDED: ['FINALIZED'],
  FINALIZED: [], REJECTED: [], CANCELED: []
}
export const canTransition = (from, to) => transitions[from]?.includes(to) || false
export const assertTransition = (from, to) => { if (!canTransition(from, to)) throw { status: 409, message: `La cita no puede pasar de ${from} a ${to}.` } }
export const cancellableStatuses = ['PENDING', 'ACCEPTED', 'RESCHEDULED']
