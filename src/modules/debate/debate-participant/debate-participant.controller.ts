import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
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
  @Public()
  getAllParticipants(@Param('roomid') roomId: string) {
    return this.debateParticipantService.findAllParticipants(roomId);
  }

  @Get('opinion/:roomid')
  @Public()
  getAllParticipantsOpinion(@Param('roomid') roomId: string) {
    return this.debateParticipantService.findAllParticipantsOpinion(roomId);
  }

  @Put('opinion')
  @Public()
  addOpinion(@Body() AddOpinionDto: AddOpinionDto) {
    return this.debateParticipantService.addOpinion(AddOpinionDto);
  }
}
