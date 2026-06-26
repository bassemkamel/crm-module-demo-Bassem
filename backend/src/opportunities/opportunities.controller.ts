import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Paginated } from '../common/pagination';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { QueryOpportunitiesDto } from './dto/query-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityResponse } from './opportunity.mapper';
import { PipelineSummary } from './opportunity.summary';

@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an opportunity' })
  @ApiCreatedResponse({ description: 'The opportunity has been created.' })
  @ApiBadRequestResponse({ description: 'Validation failed or client missing.' })
  create(@Body() dto: CreateOpportunityDto): Promise<OpportunityResponse> {
    return this.opportunitiesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List opportunities with filters and server-side pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of opportunities.' })
  findAll(
    @Query() query: QueryOpportunitiesDto,
  ): Promise<Paginated<OpportunityResponse>> {
    return this.opportunitiesService.findAll(query);
  }

  @Get('pipeline/summary')
  @ApiOperation({ summary: 'Pipeline summary (aggregated KPIs)' })
  @ApiOkResponse({ description: 'Aggregated pipeline metrics.' })
  getPipelineSummary(): Promise<PipelineSummary> {
    return this.opportunitiesService.getPipelineSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single opportunity by id' })
  @ApiOkResponse({ description: 'The requested opportunity with its client.' })
  @ApiNotFoundResponse({ description: 'Opportunity not found.' })
  findOne(@Param('id') id: string): Promise<OpportunityResponse> {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiOkResponse({ description: 'The updated opportunity.' })
  @ApiNotFoundResponse({ description: 'Opportunity not found.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ): Promise<OpportunityResponse> {
    return this.opportunitiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an opportunity' })
  @ApiNoContentResponse({ description: 'The opportunity has been deleted.' })
  @ApiNotFoundResponse({ description: 'Opportunity not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.opportunitiesService.remove(id);
  }
}
