-- Operational indexes for availability, queues and administration.
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");
CREATE INDEX "Schedule_serviceId_dayOfWeek_active_idx" ON "Schedule"("serviceId", "dayOfWeek", "active");
CREATE INDEX "Appointment_citizenId_scheduledAt_idx" ON "Appointment"("citizenId", "scheduledAt");
CREATE INDEX "Appointment_serviceId_scheduledAt_idx" ON "Appointment"("serviceId", "scheduledAt");
CREATE INDEX "Appointment_assignedEmployeeId_status_idx" ON "Appointment"("assignedEmployeeId", "status");
CREATE INDEX "Appointment_status_scheduledAt_idx" ON "Appointment"("status", "scheduledAt");

-- Audit fields for schedule management. Defaults also safely backfill existing rows.
ALTER TABLE "Schedule"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
