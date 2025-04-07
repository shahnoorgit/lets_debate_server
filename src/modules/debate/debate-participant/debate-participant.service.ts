import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DebateParticipant } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AddOpinionDto } from './dto/add-opinion.dto';
import { OpinionJob } from 'src/jobs/opinion/opinion.job';

@Injectable()
export class DebateParticipantService {
  private readonly logger = new Logger(DebateParticipantService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly opinionJob: OpinionJob,
  ) {}

  async addParticipant(
    data: AddParticipantDto,
    userId: string,
  ): Promise<DebateParticipant> {
    try {
      const participant = await this.prisma.debateParticipant.create({
        data: {
          debateRoomId: data.roomId,
          userId: userId,
        },
        include: {
          debateRoom: true,
        },
      });
      return participant;
    } catch (error) {
      this.logger.error(
        `Failed to add participant (User: ${userId}) to room (${data.roomId}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add participant to the debate room',
      );
    }
  }

  async findAllParticipants(roomId: string): Promise<DebateParticipant[]> {
    try {
      const participants = await this.prisma.debateParticipant.findMany({
        where: { debateRoomId: roomId },
        include: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      });
      return participants;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve participants for room (${roomId}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve participants');
    }
  }

  async findAllParticipantsOpinion(
    roomId: string,
    orderBy: 'date' | 'votes' | 'score' = 'score',
  ): Promise<DebateParticipant[]> {
    try {
      const opinions = await this.prisma.debateParticipant.findMany({
        where: {
          debateRoomId: roomId,
          opinion: {
            not: null,
          },
          agreed: {
            not: null,
          },
          aiFlagged: false,
        },
        include: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      });

      const sortedOpinions = [...opinions].sort((a, b) => {
        if (orderBy === 'date') {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if ((orderBy = 'score')) {
          return (b.aiScore ?? 0) - (a.aiScore ?? 0);
        } else {
          return (b.upvotes ?? 0) - (a.upvotes ?? 0);
        }
      });

      return sortedOpinions;
    } catch (error) {
      console.error(`Error fetching opinions for room ${roomId}:`, error);
      throw new InternalServerErrorException(
        'Failed to fetch participant opinions',
      );
    }
  }

  async addOpinion(AddOpinionDto: AddOpinionDto): Promise<DebateParticipant> {
    try {
      const { roomId, isAgree, opinion } = AddOpinionDto;
      const user_id = 'bc0a1a3c-a95e-46fe-a05b-b2ce1750a8dd';

      const updatedParticipant = await this.prisma.debateParticipant.update({
        where: {
          debateRoomId_userId: {
            debateRoomId: roomId,
            userId: user_id,
          },
        },
        data: {
          opinion: opinion,
          agreed: isAgree,
        },
      });

      // Queue the job to score the opinion asynchronously
      const job = this.opinionJob.addOpinionJob({
        debateRoomId: roomId,
        userId: user_id,
        text: opinion,
      });
      this.logger.log(`Opinion job added for user ${user_id} in room ${job}`);
      return updatedParticipant;
    } catch (error) {
      this.logger.error(
        `Failed to add opinion for user: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to add opinion');
    }
  }
}
