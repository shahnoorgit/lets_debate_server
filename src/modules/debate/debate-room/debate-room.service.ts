import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AIEnrichedDto } from './dto/aiEnrichedDto.dto';
import { CategoryEnum } from 'src/enum/user.enum';

@Injectable()
export class DebateRoomService {
  constructor(private readonly prisma: PrismaService) {}

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
}
