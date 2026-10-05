import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validate, validateQuery } from '../middlewares/validate.js'
import { adminAppointments, adminAudit, adminDashboard, adminEmployees, adminServices, adminSchedules, adminUsers, createEmployee, createRequirement, createSchedule, createService, deleteRequirement, getEmployee, getUser, setEmployeeServices, setEmployeeStatus, setScheduleStatus, setServiceStatus, setUserStatus, updateEmployee, updateRequirement, updateSchedule, updateService } from '../controllers/admin.controller.js'
import { activeSchema, auditFiltersSchema, employeeCreateSchema, employeeFiltersSchema, employeeServicesSchema, employeeUpdateSchema, requirementCreateSchema, requirementUpdateSchema, scheduleSchema, scheduleUpdateSchema, serviceSchema, userFiltersSchema, userStatusSchema } from '../validators/admin.validator.js'
const router = Router()
router.use(authenticate, authorize('ADMIN'))
router.get('/dashboard', adminDashboard)
router.get('/appointments', adminAppointments)
router.get('/audit', validateQuery(auditFiltersSchema), adminAudit)
router.get('/users', validateQuery(userFiltersSchema), adminUsers)
router.get('/users/:id', getUser)
router.patch('/users/:id/status', validate(userStatusSchema), setUserStatus)
router.get('/employees', validateQuery(employeeFiltersSchema), adminEmployees)
router.post('/employees', validate(employeeCreateSchema), createEmployee)
router.get('/employees/:id', getEmployee)
router.patch('/employees/:id', validate(employeeUpdateSchema), updateEmployee)
router.patch('/employees/:id/status', validate(userStatusSchema), setEmployeeStatus)
router.put('/employees/:id/services', validate(employeeServicesSchema), setEmployeeServices)
router.get('/schedules', adminSchedules)
router.post('/schedules', validate(scheduleSchema), createSchedule)
router.patch('/schedules/:id', validate(scheduleUpdateSchema), updateSchedule)
router.patch('/schedules/:id/status', validate(activeSchema), setScheduleStatus)
router.get('/services', adminServices)
router.post('/services', validate(serviceSchema), createService)
router.patch('/services/:id', validate(serviceSchema.partial()), updateService)
router.patch('/services/:id/status', validate(activeSchema), setServiceStatus)
router.post('/services/:id/requirements', validate(requirementCreateSchema), createRequirement)
router.patch('/requirements/:id', validate(requirementUpdateSchema), updateRequirement)
router.delete('/requirements/:id', deleteRequirement)
export default router