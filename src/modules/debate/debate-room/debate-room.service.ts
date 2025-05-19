import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AIEnrichedDto } from './dto/aiEnrichedDto.dto';
import { CategoryEnum } from 'src/enum/user.enum';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { InterestEnum } from '@prisma/client';

interface ScoredDebate {
  debate: {
    id: string;
    title: string;
    description: string;
    image: string;
    createdAt: Date;
    duration: number;
    upvotes: number;
    shares: number;
    creator_id: string;
    creator: {
      id: string;
      username: string;
      reputationScore: number;
    };
    categories: {
      category: CategoryEnum;
      sub_categories: {
        subCategory: InterestEnum;
      }[];
    }[];
    participants: {
      userId: string;
      upvotes: number;
    }[];
    _count: {
      participants: number;
    };
  };
  score: number;
  matchedCategories: CategoryEnum[];
  matchedInterests: InterestEnum[];
}

@Injectable()
export class DebateRoomService {
  private readonly logger = new Logger(DebateRoomService.name);
  private readonly ttl: number;
  private createWeightMap<T, K extends keyof T, V extends keyof T>(
    items: T[],
    keyField: K,
    valueField: V,
  ): Map<T[K], T[V]> {
    const map = new Map();
    items.forEach((item) => {
      map.set(item[keyField], item[valueField]);
    });
    return map;
  }
  private diversifyResults(
    scoredDebates: { score: number; matchedCategories: string[] }[],
  ) {
    const result: { score: number; matchedCategories: string[] }[] = [];
    const categoryWindowSize = 5;
    const categoryOccurrences = new Map();

    for (const item of scoredDebates) {
      let shouldDemote = false;

      for (const category of item.matchedCategories) {
        const occurrences = categoryOccurrences.get(category) || 0;
        if (occurrences >= Math.ceil(categoryWindowSize * 0.6)) {
          shouldDemote = true;
          break;
        }
      }

      if (shouldDemote) {
        // Apply diversity penalty
        const penalizedItem: { score: number; matchedCategories: string[] } = {
          ...item,
          score: item.score * 0.7,
        };

        // Find insertion point
        const insertionIndex = result.findIndex(
          (r) => r.score < penalizedItem.score,
        );
        if (insertionIndex === -1) {
          result.push(penalizedItem);
        } else {
          result.splice(insertionIndex, 0, penalizedItem);
        }
      } else {
        // Add item and update category occurrences
        result.push(item);
        for (const category of item.matchedCategories) {
          categoryOccurrences.set(
            category,
            (categoryOccurrences.get(category) || 0) + 1,
          );
        }
      }

      // Remove oldest occurrences if window too large
      if (result.length > categoryWindowSize) {
        const oldestItem = result[result.length - categoryWindowSize - 1];
        if (oldestItem) {
          for (const category of oldestItem.matchedCategories) {
            const currentOccurrences = categoryOccurrences.get(category) || 0;
            if (currentOccurrences > 0) {
              categoryOccurrences.set(category, currentOccurrences - 1);
            }
          }
        }
      }
    }

    return result;
  }

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.ttl = this.configService.get<number>('CACHE_TTL') || 3600; // Initialize ttl
  }

  async create(createDebateRoomDto: AIEnrichedDto, clerk_id: string) {
    const {
      title,
      description,
      duration,
      image,
      keywords,
      categorized_interests,
    } = createDebateRoomDto;

    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerk_id },
    });

    const notEligible = await this.prisma.debate_room.findFirst({
      where: {
        creator_id: user?.id,
        active: true,
        deletedAt: null,
      },
    });

    if (notEligible) {
      throw new HttpException(
        'You already have an active debate room',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user) throw new Error('User not found');

    // Create Debate Room
    const debateRoom = await this.prisma.debate_room.create({
      data: {
        title,
        description,
        duration,
        image,
        creator_id: user.id,
        keywords,
      },
    });

    // Loop over categorized_interests to add categories and subcategories
    for (const { category, interests } of categorized_interests) {
      // Create category entry
      const categoryEntry = await this.prisma.debate_room_Category.create({
        data: {
          debate_roomId: debateRoom.id,
          category,
        },
      });

      if (interests.length) {
        await this.prisma.debate_room_SubCategory.createMany({
          data: interests.map((interest) => ({
            debate_room_categoryId: categoryEntry.id,
            subCategory: interest,
          })),
          skipDuplicates: true,
        });
      }
    }

    return debateRoom;
  }

  async getPersonalizedFeed(
    clerk_id: string,
    page: number = 1,
    limit: number = 50,
    cursor?: string,
  ) {
    // Try to get from cache first
    const cacheKey = `feed:${clerk_id}:${page}:${limit}:${cursor || 'start'}`;
    const cachedFeed = await this.cacheManager.get<any>(cacheKey);

    if (cachedFeed) {
      return cachedFeed;
    }

    const userId = await this.prisma.user.findUnique({
      where: { clerkId: clerk_id },
      select: {
        id: true,
      },
    });

    try {
      // Find user with preferences
      const user = await this.prisma.user.findUnique({
        where: { id: userId?.id },
        select: {
          id: true,
          blocked_intrests: true,
          following: true,
          categories: {
            select: {
              name: true,
              weight: true,
              interests: {
                select: {
                  name: true,
                  weight: true,
                },
              },
            },
          },
        },
      });
      this.logger.log(user);

      if (!user) {
        throw new Error('User not found');
      }

      // Extract user's preferences
      const userCategoryNames = user.categories.map((cat) => cat.name);
      const userCategoryWeights = this.createWeightMap(
        user.categories,
        'name',
        'weight',
      );
      const userInterestWeights = new Map<InterestEnum, number>();

      // Flatten interests and their weights
      user.categories.forEach((category) => {
        category.interests.forEach((interest) => {
          userInterestWeights.set(interest.name, interest.weight);
        });
      });

      const blockedInterests = new Set(user.blocked_intrests);
      const following = new Set(user.following);

      // Cursor-based query conditions
      const cursorCondition = cursor
        ? { cursor: { id: cursor }, skip: 1 } // Skip the cursor item
        : {};
      const queryOptions: {
        cursor?: { id: string };
        skip?: number;
        where: {
          active: boolean;
          deletedAt: null;
          categories: {
            some: {
              category: {
                in: CategoryEnum[];
              };
            };
          };
          participants: {
            none: {
              userId: string;
            };
          };
        };
        select: {
          id: boolean;
          title: boolean;
          description: boolean;
          image: boolean;
          createdAt: boolean;
          duration: boolean;
          upvotes: boolean;
          shares: boolean;
          creator_id: boolean;
          creator: {
            select: {
              id: boolean;
              username: boolean;
              reputationScore: boolean;
              image: boolean;
            };
          };
          categories: {
            select: {
              category: boolean;
              sub_categories: {
                select: {
                  subCategory: boolean;
                };
              };
            };
          };
          participants: {
            select: {
              userId: boolean;
              upvotes: boolean;
              agreed: boolean;
            };
          };
          _count: {
            select: {
              participants: boolean;
            };
          };
        };
        take: number;
      } = {
        where: {
          active: true,
          deletedAt: null,
          categories: {
            some: {
              category: {
                in: userCategoryNames as CategoryEnum[],
              },
            },
          },
          // Added filter to exclude debates the user has already joined
          participants: {
            none: {
              userId: user.id,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          createdAt: true,
          duration: true,
          upvotes: true,
          shares: true,
          creator_id: true,
          creator: {
            select: {
              id: true,
              username: true,
              reputationScore: true,
              image: true,
            },
          },
          categories: {
            select: {
              category: true,
              sub_categories: {
                select: {
                  subCategory: true,
                },
              },
            },
          },
          participants: {
            select: {
              userId: true,
              upvotes: true,
              agreed: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        take: limit,
        ...cursorCondition, // Add cursor pagination
      };

      // Execute the query
      const debates = await this.prisma.debate_room.findMany(queryOptions);
      const totalCount = await this.prisma.debate_room.count({
        where: {
          active: true,
          deletedAt: null,
          categories: {
            some: {
              category: {
                in: userCategoryNames as CategoryEnum[],
              },
            },
          },
          // Added same filter to count query
          // participants: {
          //   none: {
          //     userId: user.id,
          //   },
          // },
        },
      });

      let scoredDebates = debates
        .filter((debate) => {
          // Filter out debates with blocked interests
          for (const category of debate.categories) {
            for (const subCategory of category.sub_categories) {
              if (blockedInterests.has(subCategory.subCategory)) {
                return false;
              }
            }
          }
          return true;
        })
        .map((debate) => {
          // Calculate relevance scores
          let categoryMatchScore = 0;
          let interestMatchScore = 0;
          let engagementScore = 0;
          let socialRelevanceScore = 0;
          let freshnessScore = 0;

          const matchedCategories = new Set<CategoryEnum>();
          const matchedInterests = new Set<InterestEnum>();

          // Score category matches
          debate.categories.forEach((category) => {
            const weight = userCategoryWeights.get(category.category) || 0;
            if (weight > 0) {
              categoryMatchScore += weight * 3;
              matchedCategories.add(category.category as CategoryEnum);
            }

            // Score subcategory matches
            category.sub_categories.forEach((subCat) => {
              const interestWeight =
                userInterestWeights.get(subCat.subCategory) || 0;
              if (interestWeight > 0) {
                interestMatchScore += interestWeight * 2;
                matchedInterests.add(subCat.subCategory);
              }
            });
          });

          // Engagement score
          engagementScore = Math.log(
            1 +
              debate.upvotes * 2 +
              debate.shares +
              debate._count.participants * 3,
          );

          // Social relevance - connections
          if (following.has(debate.creator_id)) {
            socialRelevanceScore += 15;
          }

          // Network participation
          const networkParticipants = debate.participants.filter((p) =>
            following.has(p.userId),
          ).length;
          socialRelevanceScore += networkParticipants * 5;

          // Time decay factor
          const ageInHours =
            (new Date().getTime() - debate.createdAt.getTime()) / (1000 * 3600);
          freshnessScore = 100 / (1 + (ageInHours / 24) * 0.8);

          // Final weighted score
          const finalScore =
            categoryMatchScore * 2.5 +
            interestMatchScore * 2.0 +
            engagementScore * 1.2 +
            socialRelevanceScore * 1.0 +
            freshnessScore * 1.5;

          return {
            debate,
            score: finalScore,
            matchedCategories: Array.from(matchedCategories),
            matchedInterests: Array.from(matchedInterests),
          };
        });

      // Sort by score
      scoredDebates.sort((a, b) => b.score - a.score);

      // Apply any transformation or logic to scoredDebates
      scoredDebates = scoredDebates.map((debate) => ({
        ...debate,
        score: debate.score + 10, // Example: Add 10 to each score
      }));

      // Transform results for API response
      const results = scoredDebates.map((item) => ({
        id: item.debate.id,
        title: item.debate.title,
        description: item.debate.description,
        image: item.debate.image,
        createdAt: item.debate.createdAt,
        duration: item.debate.duration,
        upvotes: item.debate.upvotes,
        shares: item.debate.shares,
        participants: item.debate.participants,
        participantCount: item.debate._count.participants,
        agreedCount: item.debate.participants.reduce((sum, participant) => {
          return sum + (participant.agreed === true ? 1 : 0);
        }, 0),
        disagreedCount: item.debate.participants.reduce((sum, participant) => {
          return sum + (participant.agreed === false ? 1 : 0);
        }, 0),
        vote_count: item.debate.participants.reduce((sum, participant) => {
          return sum + (participant.agreed ? 1 : 0);
        }, 0),
        creator: {
          id: item.debate.creator.id,
          username: item.debate.creator.username,
          image: item.debate.creator.image,
        },
        categories: item.debate.categories.map((c) => c.category),
        subCategories: item.debate.categories.flatMap((c) =>
          c.sub_categories.map((sc) => sc.subCategory),
        ),
      }));

      // Determine next cursor
      const nextCursor =
        results.length > 0 ? results[results.length - 1].id : null;

      // Prepare response with pagination metadata
      const response = {
        data: results,
        pagination: {
          totalCount,
          page,
          limit,
          hasNextPage: results.length === limit,
          nextCursor,
        },
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, response, 60000);

      return response;
    } catch (error) {
      this.logger.error(`Error generating feed for user ${clerk_id}:`, error);
      throw error;
    }
  }

  async getDebateRoomById(debate_id: string) {
    try {
      const room = await this.prisma.debate_room.findUnique({
        where: { id: debate_id },
        include: {
          creator: {
            select: {
              id: true,
              image: true,
              username: true,
            },
          },
        },
      });

      if (!room) {
        return new HttpException('Room Not Found', HttpStatus.NOT_FOUND);
      }

      return room;
    } catch (error) {
      this.logger.error(`Error getting room ${debate_id}:`, error);
      throw error;
    }
  }

  async getUserParticipatedDebates(clerk_id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
        select: { id: true },
      });

      if (!user) {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }

      const debates = await this.prisma.debateParticipant.findMany({
        where: { userId: user.id },
        select: {
          userId: true,
          debateRoom: true,
          debateRoomId: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!debates || debates.length === 0) {
        return [];
      }

      // Get unique debateRoomIds
      const debateRoomIds = [...new Set(debates.map((d) => d.debateRoomId))];

      // Count participants for each debateRoomId in one go
      const counts = await this.prisma.debateParticipant.groupBy({
        by: ['debateRoomId'],
        where: {
          debateRoomId: { in: debateRoomIds },
        },
        _count: true,
      });

      const countMap = new Map(counts.map((c) => [c.debateRoomId, c._count]));

      // Attach joinedUsers count to each debate
      const result = debates.map((debate) => ({
        ...debate,
        joinedUsers: countMap.get(debate.debateRoomId) || 0,
      }));

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting participated debates for user ${clerk_id}:`,
        error,
      );
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDebateEligibility(clerk_id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
        include: {
          created_debates: {
            where: { active: true },
            select: { active: true },
          },
        },
      });
      if (!user) {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }
      if (user.created_debates.length === 0) {
        return true;
      }
      return user.created_debates[0].active ? false : true;
    } catch (error) {
      this.logger.error(
        `Error getting participated debates for user ${clerk_id}:`,
        error,
      );
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserCreatedParticipatedDebates(clerk_id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: clerk_id },
        select: { id: true },
      });

      if (!user) {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }

      const debates = await this.prisma.debateParticipant.findMany({
        where: { debateRoom: { creator: { clerkId: clerk_id } } },
        select: {
          userId: true,
          debateRoom: true,
          debateRoomId: true,
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!debates || debates.length === 0) {
        return [];
      }

      // Get unique debateRoomIds
      const debateRoomIds = [...new Set(debates.map((d) => d.debateRoomId))];

      // Count participants for each debateRoomId in one go
      const counts = await this.prisma.debateParticipant.groupBy({
        by: ['debateRoomId'],
        where: {
          debateRoomId: { in: debateRoomIds },
        },
        _count: true,
      });

      const countMap = new Map(counts.map((c) => [c.debateRoomId, c._count]));

      // Attach joinedUsers count to each debate
      const result = debates.map((debate) => ({
        ...debate,
        joinedUsers: countMap.get(debate.debateRoomId) || 0,
      }));

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting participated debates for user ${clerk_id}:`,
        error,
      );
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
