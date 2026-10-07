import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CarbonProjectService } from './carbon-project.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import {
  CreateCarbonProjectDto,
  UpdateCarbonProjectStatusDto,
} from './dto/carbon-project.dto';

/**
 * Farmer-facing project context. Corporate also reads projects, but through
 * their own aggregate endpoints; both return the same aggregate shape and
 * neither exposes individual farmer identity.
 */
@Controller('carbon/projects')
export class CarbonProjectController {
  constructor(private readonly projectService: CarbonProjectService) {}

  @Get()
  @Roles('FARMER', 'CORPORATE', 'ADMIN')
  listProjects() {
    return this.projectService.listProjects();
  }

  @Get(':id')
  @Roles('FARMER', 'CORPORATE', 'ADMIN')
  getProject(@Param('id') id: string) {
    return this.projectService.getProject(id);
  }
}

@Controller('admin/carbon-projects')
@Roles('ADMIN')
export class AdminCarbonProjectController {
  constructor(private readonly projectService: CarbonProjectService) {}

  @Get()
  listProjects() {
    return this.projectService.listProjects();
  }

  @Post()
  createProject(
    @Body() dto: CreateCarbonProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.createProject(user.sub, dto);
  }

  /** Preview of the eligibility filter, so it can be inspected before acting. */
  @Get('eligible-farms')
  listEligibleFarms() {
    return this.projectService.listEligibleFarms();
  }

  @Post(':id/aggregate')
  aggregate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectService.aggregate(user.sub, id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCarbonProjectStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.changeStatus(user.sub, id, dto.status);
  }
}
