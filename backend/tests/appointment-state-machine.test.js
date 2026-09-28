import { describe, expect, it } from 'vitest'
import { assertTransition, canTransition, cancellableStatuses } from '../src/utils/appointmentStateMachine.js'

describe('appointment state machine', () => {
  it('allows the operational flow', () => {
    expect(canTransition('PENDING', 'ACCEPTED')).toBe(true)
    expect(canTransition('ACCEPTED', 'ATTENDED')).toBe(true)
    expect(canTransition('ATTENDED', 'FINALIZED')).toBe(true)
  })

  it('rejects invalid and terminal transitions', () => {
    expect(canTransition('FINALIZED', 'ACCEPTED')).toBe(false)
    expect(() => assertTransition('REJECTED', 'ATTENDED')).toThrow()
  })

  it('only permits canceling active appointments', () => {
    expect(cancellableStatuses).toEqual(['PENDING', 'ACCEPTED', 'RESCHEDULED'])
  })
})
