import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { DebateRoomService } from './debate-room.service';
import { CreateDebateRoomDto } from './dto/create-debate-room.dto';
import { AiService } from './ai/debate-room-ai.service';
import { AIEnrichedDto } from './dto/aiEnrichedDto.dto';
import { plainToInstance } from 'class-transformer';
import { Public } from 'src/comman/decorators/public.decorator';
import { User } from 'src/comman/decorators/req-user.decorator';

@Controller('debate-room')
export class DebateRoomController {
  constructor(
    private readonly debateRoomService: DebateRoomService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async createDebateRoom(
    @User() user: any,
    @Body() createDebateRoomDto: CreateDebateRoomDto,
  ) {
    const enrichedData =
      await this.aiService.enrichDebateRoom(createDebateRoomDto);
    const enriched = plainToInstance(AIEnrichedDto, enrichedData);
    return this.debateRoomService.create(enriched, user.clerk_id);
  }

  @Get('/feed')
  @Public()
  async getDebateRoom(
    //@Query('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: number = 50,
    @Query('cursor') cursor: string = '',
  ) {
    return this.debateRoomService.getPersonalizedFeed(page, limit);
  }
}
