-- AlterTable
ALTER TABLE `users` ADD COLUMN `allowedMenus` TEXT NULL,
    ADD COLUMN `defaultBranchId` VARCHAR(191) NULL;
