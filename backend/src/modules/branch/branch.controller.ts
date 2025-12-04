import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('branches')
export class BranchController {
  constructor(private branchService: BranchService) {}

  /**
   * Public endpoint - Get list of active branches for Android app
   * Used for branch selection on first launch
   */
  @Get('list')
  async findAllActive() {
    return this.branchService.findAllActive();
  }

  /**
   * Public endpoint - Verify branch by code for Android app
   * Used for manual branch code entry
   */
  @Get('verify-code/:code')
  async verifyByCode(@Param('code') code: string) {
    return this.branchService.verifyByCode(code);
  }

  /**
   * Protected - Create new branch (SUPER_ADMIN only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(@Body() dto: CreateBranchDto) {
    return this.branchService.create(dto);
  }

  /**
   * Protected - Get all branches with counts (Admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_ADMIN)
  async findAll() {
    return this.branchService.findAll();
  }

  /**
   * Protected - Get branch by ID (Admin)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  /**
   * Protected - Update branch (SUPER_ADMIN only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchService.update(id, dto);
  }

  /**
   * Protected - Delete branch (SUPER_ADMIN only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
