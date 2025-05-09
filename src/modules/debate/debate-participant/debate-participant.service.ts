import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DebateParticipant, InterestEnum } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AddOpinionDto } from './dto/add-opinion.dto';
import { OpinionJob } from 'src/jobs/opinion/opinion.job';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class DebateParticipantService {
  private readonly logger = new Logger(DebateParticipantService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly opinionJob: OpinionJob,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async addParticipant(
    data: AddParticipantDto,
    clerk_id: string,
  ): Promise<DebateParticipant> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
      });
      const participant = await this.prisma.debateParticipant.create({
        data: { debateRoomId: data.roomId, userId: user?.id! },
        include: {
          debateRoom: {
            include: {
              categories: {
                include: { sub_categories: true }, // fetch sub_categories linked to each category
              },
            },
          },
        },
      });

      const { debateRoom } = participant;

      for (const roomCat of debateRoom.categories) {
        let userCategory = await this.prisma.category.findFirst({
          where: { userId: user?.id, name: roomCat.category },
        });

        userCategory = userCategory
          ? await this.prisma.category.update({
              where: { id: userCategory.id },
              data: { weight: { increment: 1 } },
            })
          : await this.prisma.category.create({
              data: { userId: user?.id!, name: roomCat.category, weight: 1 },
            });

        // Now handle each sub-category (interest) under this room category
        for (const subCat of roomCat.sub_categories) {
          const interestEnumValue =
            InterestEnum[subCat.subCategory as keyof typeof InterestEnum];

          const userInterest = await this.prisma.interest.findFirst({
            where: { name: interestEnumValue, categoryId: userCategory.id },
          });

          if (userInterest) {
            await this.prisma.interest.update({
              where: { id: userInterest.id },
              data: { weight: { increment: 1 } },
            });
          } else {
            await this.prisma.interest.create({
              data: {
                name: interestEnumValue,
                weight: 1,
                categoryId: userCategory.id,
              },
            });
          }
        }
      }

      return participant;
    } catch (error) {
      this.logger.error(
        `Failed to add participant (User: ${clerk_id}) to room (${data.roomId}): ${error.message}`,
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
    clerk_id: string,
    roomId: string,
    orderBy: 'date' | 'votes' | 'score' = 'score',
    page = 1,
    pageSize = 20,
  ) {
    const prismaOrderBy = {
      date: { createdAt: 'desc' as const },
      votes: { upvotes: 'desc' as const },
      score: { aiScore: 'desc' as const },
    };
    const skip = (page - 1) * pageSize;

    try {
      // Fetch one extra to check for next page
      const results = await this.prisma.debateParticipant.findMany({
        where: {
          debateRoomId: roomId,
          opinion: { not: null },
          agreed: { not: null },
          aiFlagged: false,
        },
        include: {
          user: { select: { username: true, image: true, clerkId: true } },
        },
        orderBy: prismaOrderBy[orderBy],
        skip,
        take: pageSize + 1, // fetch one more than needed
      });

      const hasNextPage = results.length > pageSize;
      const trimmedResults = hasNextPage ? results.slice(0, pageSize) : results;

      return {
        data: trimmedResults,
        currentUserOpinion: results.find(
          (opinion) =>
        opinion.user.clerkId === clerk_id && opinion.opinion !== null,
        ) || null,
        nextPage: hasNextPage,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to fetch opinions');
    }
  }

  async addOpinion(
    AddOpinionDto: AddOpinionDto,
    clerk_id: string,
  ): Promise<DebateParticipant> {
    try {
      const { roomId, isAgree, opinion } = AddOpinionDto;

      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
        select: { id: true },
      });

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }

      const updatedParticipant = await this.prisma.debateParticipant.update({
        where: {
          debateRoomId_userId: {
            debateRoomId: roomId,
            userId: user?.id!,
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
        userId: user?.id!,
        text: opinion,
      });
      this.logger.log(`Opinion job added for user ${clerk_id} in room ${job}`);
      return updatedParticipant;
    } catch (error) {
      this.logger.error(
        `Failed to add opinion for user: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to add opinion');
    }
  }

  async likeOpinion(
    opinionUserId: string,
    debateId: string,
    currentUserId: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: currentUserId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Prevent users from upvoting their own opinions
      if (user.id === opinionUserId) {
        throw new BadRequestException('You cannot upvote your own opinion');
      }

      // Check if this user has already upvoted this opinion
      const existingUpvote = await this.prisma.participantUpvote.findUnique({
        where: {
          userId_debateRoomId_participantUserId: {
            userId: user.id,
            debateRoomId: debateId,
            participantUserId: opinionUserId,
          },
        },
      });

      if (existingUpvote) {
        const [, opinion] = await this.prisma.$transaction([
          this.prisma.participantUpvote.delete({
            where: {
              userId_debateRoomId_participantUserId: {
                userId: user.id,
                debateRoomId: debateId,
                participantUserId: opinionUserId,
              },
            },
          }),
          // Decrement the counter
          this.prisma.debateParticipant.update({
            where: {
              debateRoomId_userId: {
                debateRoomId: debateId,
                userId: opinionUserId,
              },
            },
            data: {
              upvotes: { decrement: 1 },
            },
          }),
        ]);

        return {
          likes: opinion.upvotes,
          action: 'unliked',
        };
      }
      // Otherwise, add the upvote
      else {
        const [, opinion] = await this.prisma.$transaction([
          // Create the upvote record
          this.prisma.participantUpvote.create({
            data: {
              userId: user.id,
              debateRoomId: debateId,
              participantUserId: opinionUserId,
            },
          }),
          // Increment the counter
          this.prisma.debateParticipant.update({
            where: {
              debateRoomId_userId: {
                debateRoomId: debateId,
                userId: opinionUserId,
              },
            },
            data: {
              upvotes: { increment: 1 },
            },
          }),
        ]);

        return {
          likes: opinion.upvotes,
          action: 'liked',
        };
      }
    } catch (error) {
      // Check if the error is a known type and pass it through
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to like opinion (Opinion User ID: ${opinionUserId}, Debate ID: ${debateId}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to like opinion');
    }
  }

  async getLikedOpinions(clerk_id: string, debate_id: string) {
    try {
      const cacheKey = `liked_opinions_${clerk_id}_${debate_id}`;
      const cachedData = await this.cacheManager.get<string[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const likedOpinions = await this.prisma.participantUpvote.findMany({
        where: {
          userId: user.id,
          debateRoomId: debate_id,
        },
        select: {
          participantUserId: true,
        },
      });
      const likedOpinionIds = likedOpinions.map(
        (opinion) => opinion.participantUserId,
      );
      await this.cacheManager.set(cacheKey, likedOpinionIds, 3600); // Cache for 1 hour
      return likedOpinionIds;
    } catch (error) {
      this.logger.error(
        `Failed to get liked opinions (User: ${clerk_id}, Debate ID: ${debate_id}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get liked opinions');
    }
  }
}
