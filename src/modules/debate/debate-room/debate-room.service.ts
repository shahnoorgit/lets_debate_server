import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AIEnrichedDto } from './dto/aiEnrichedDto.dto';
import { CategoryEnum } from 'src/enum/user.enum';

@Injectable()
export class DebateRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDebateRoomDto: AIEnrichedDto) {
    const {
      title,
      description,
      duration,
      image,
      keywords,
      sub_categories,
      categories,
    } = createDebateRoomDto;

    const debateRoom = await this.prisma.debate_room.create({
      data: {
        title,
        description,
        duration,
        image,
        creator_id: 'bc0a1a3c-a95e-46fe-a05b-b2ce1750a8dd',
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
