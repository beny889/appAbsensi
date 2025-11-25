-- CreateTable
CREATE TABLE "work_schedules" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_department_key" ON "work_schedules"("department");

-- CreateIndex
CREATE INDEX "work_schedules_department_idx" ON "work_schedules"("department");
