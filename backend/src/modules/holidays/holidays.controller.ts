import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async findAll(@Query('year') year?: string) {
    if (year) {
      return this.holidaysService.findByYear(parseInt(year, 10));
    }
    return this.holidaysService.findAll();
  }

  @Get('month')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async findByMonth(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.holidaysService.findByMonth(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidaysService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
