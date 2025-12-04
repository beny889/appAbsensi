-- AlterTable
ALTER TABLE `face_match_attempts` ADD COLUMN `branchId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `holidays` ADD COLUMN `branchId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `face_match_attempts_branchId_idx` ON `face_match_attempts`(`branchId`);

-- CreateIndex
CREATE INDEX `holidays_branchId_idx` ON `holidays`(`branchId`);

-- AddForeignKey
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `face_match_attempts` ADD CONSTRAINT `face_match_attempts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
