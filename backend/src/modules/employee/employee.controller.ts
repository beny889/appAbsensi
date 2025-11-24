import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Post,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { UpdateEmployeeDto, RegisterFaceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeeService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.employeeService.delete(id);
  }

  @Post('face-register')
  async registerFace(@CurrentUser() user: any, @Body() dto: RegisterFaceDto) {
    return this.employeeService.registerFace(user.id, dto);
  }

  @Get('face-status/:id')
  async checkFaceStatus(@Param('id') id: string) {
    const hasface = await this.employeeService.hasFaceRegistered(id);
    return {
      hasFaceRegistered: hasface,
    };
  }
}
