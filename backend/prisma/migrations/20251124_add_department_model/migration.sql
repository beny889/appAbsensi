-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- AddColumn (nullable first)
ALTER TABLE "users" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "work_schedules" ADD COLUMN "departmentId" TEXT;

-- Migrate data: Create departments from existing work_schedules
INSERT INTO "departments" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "department",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "work_schedules"
WHERE "department" IS NOT NULL
GROUP BY "department"
ON CONFLICT ("name") DO NOTHING;

-- Update work_schedules with departmentId
UPDATE "work_schedules" ws
SET "departmentId" = d."id"
FROM "departments" d
WHERE ws."department" = d."name";

-- Update users with departmentId (if they have a department string)
UPDATE "users" u
SET "departmentId" = d."id"
FROM "departments" d
WHERE u."department" = d."name";

-- Make departmentId required for work_schedules
ALTER TABLE "work_schedules" ALTER COLUMN "departmentId" SET NOT NULL;

-- DropColumn
ALTER TABLE "users" DROP COLUMN "department";
ALTER TABLE "work_schedules" DROP COLUMN "department";

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
CREATE UNIQUE INDEX "work_schedules_departmentId_key" ON "work_schedules"("departmentId");
CREATE INDEX "work_schedules_departmentId_idx" ON "work_schedules"("departmentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
