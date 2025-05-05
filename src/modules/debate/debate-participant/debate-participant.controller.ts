import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Logger,
} from '@nestjs/common';
import { DebateParticipantService } from './debate-participant.service';
import { Public } from 'src/comman/decorators/public.decorator';
import { AddParticipantDto } from './dto/add-participant.dto';
import { User } from 'src/comman/decorators/req-user.decorator';
import { AddOpinionDto } from './dto/add-opinion.dto';

@Controller('debate-participant')
export class DebateParticipantController {
  constructor(
    private readonly debateParticipantService: DebateParticipantService,
  ) {}

  @Post()
  create(@Body() addParticipantDto: AddParticipantDto, @User() user: any) {
    return this.debateParticipantService.addParticipant(
      addParticipantDto,
      user.clerk_id,
    );
  }

  @Get(':roomid')
  getAllParticipants(@Param('roomid') roomId: string) {
    return this.debateParticipantService.findAllParticipants(roomId);
  }

  @Get('opinion/:roomid')
  getAllParticipantsOpinion(
    @Param('roomid') roomId: string,
    @Query('page') page: number,
    @Query('orderBy') orderBy: 'date' | 'votes' | 'score',
  ) {
    console.log(orderBy, page);
    return this.debateParticipantService.findAllParticipantsOpinion(
      roomId,
      orderBy,
      page,
    );
  }

  @Put('opinion')
  addOpinion(@Body() AddOpinionDto: AddOpinionDto, @User() user: any) {
    return this.debateParticipantService.addOpinion(
      AddOpinionDto,
      user.clerk_id,
    );
  }

  @Put('opinion/like/:opinionId/:debateId')
  likeOpinion(
    @Param('opinionId') opinionId: string,
    @Param('debateId') debateId: string,
    @User() user: any,
  ) {
    return this.debateParticipantService.likeOpinion(
      opinionId,
      debateId,
      user.clerk_id,
    );
  }

  @Get('opinion/liked_by/:debateId')
  getLikedBy(@Param('debateId') debateId: string, @User() user: any) {
    return this.debateParticipantService.getLikedOpinions(
      user.clerk_id,
      debateId,
    );
  }
}
