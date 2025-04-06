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
      sub_categories,
      categories,
    } = createDebateRoomDto;

    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerk_id },
    });

    const debateRoom = await this.prisma.debate_room.create({
      data: {
        title,
        description,
        duration,
        image,
        creator_id: user?.id!,
        keywords,
        sub_categories,
      },
    });

    const categoryLinks: {
      debate_roomId: string;
      category: CategoryEnum;
    }[] = categories.map((category) => ({
      debate_roomId: debateRoom.id,
      category: category as CategoryEnum,
    }));

    await this.prisma.debate_room_Category.createMany({
      data: categoryLinks,
      skipDuplicates: true,
    });

    return debateRoom;
  }
}
