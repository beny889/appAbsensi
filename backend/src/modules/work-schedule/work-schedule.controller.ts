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
import { WorkScheduleService } from './work-schedule.service';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.BRANCH_ADMIN) // Only admins can manage work schedules
export class WorkScheduleController {
  constructor(private workScheduleService: WorkScheduleService) {}

  @Post()
  async create(@Body() dto: CreateWorkScheduleDto) {
    return this.workScheduleService.create(dto);
  }

  @Get()
  async findAll() {
    return this.workScheduleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workScheduleService.findOne(id);
  }

  @Get('department/:department')
  async findByDepartment(@Param('department') department: string) {
    return this.workScheduleService.findByDepartment(department);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.workScheduleService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workScheduleService.remove(id);
  }
}
