---
description: Update project dependencies, database, and rebuild applications
---

Update and sync all components of the Absensi project:

1. **Database Migrations**
2. **Dependencies Update** (Backend + Web Admin)
3. **Rebuild Applications**
4. **Show Project Status**

## Tasks to perform:

### 1. Database Migrations
- Run pending Prisma migrations
- Generate updated Prisma client
- Show migration status

### 2. Backend Updates
- Check for outdated npm packages
- Update dependencies (optional, ask user first)
- Rebuild TypeScript

### 3. Web Admin Updates
- Check for outdated npm packages
- Update dependencies (optional, ask user first)
- Rebuild production bundle

### 4. Project Status
- Show git status (if git repo)
- Show running servers status
- Show recent changes from CHANGELOG.md
- List any pending migrations

## Important Notes:
- Always ask before updating dependencies (breaking changes risk)
- Run database backup before migrations if in production
- Show clear summary of what was updated
- Provide rollback instructions if something fails

## Execution Order:
1. Check current state (git status, server status, pending migrations)
2. Ask user what to update (migrations only, dependencies, full rebuild)
3. Perform selected updates
4. Show summary of changes
5. Verify everything still works (health checks)
