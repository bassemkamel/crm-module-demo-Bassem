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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClientResponse } from './client.mapper';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a client (company or individual)' })
  @ApiCreatedResponse({ description: 'The client has been created.' })
  create(@Body() dto: CreateClientDto): Promise<ClientResponse> {
    return this.clientsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients, optionally filtered by type' })
  @ApiOkResponse({ description: 'List of clients with a computed displayName.' })
  findAll(@Query() query: QueryClientsDto): Promise<ClientResponse[]> {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single client by id' })
  @ApiOkResponse({ description: 'The requested client.' })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  findOne(@Param('id') id: string): Promise<ClientResponse> {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiOkResponse({ description: 'The updated client.' })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponse> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiNoContentResponse({ description: 'The client has been deleted.' })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.clientsService.remove(id);
  }
}
