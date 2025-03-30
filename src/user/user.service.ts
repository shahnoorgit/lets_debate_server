import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import { Prisma, CategoryEnum, InterestEnum } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    try {
      console.log('Finding user with ID:', id);
    const user = await this.prisma.user.findUnique({
      where: { clerkId: id }
    });
    console.log('User:', user);

    if (!user) {
      return null;
    }

      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw new InternalServerErrorException('Error finding user');
    }
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });
      
      // Return true if username is available (no user found)
      return !existingUser;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw new InternalServerErrorException('Error checking username availability');
    }
  }

  async createUser(userDto: CreateUserDto) {
    try {
      // Check if the user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { clerkId: userDto.clerkId },
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      console.log('Creating user with categories:', JSON.stringify(userDto.categories));

      // Create a new user with transaction to handle categories and interests
      return await this.prisma.$transaction(async (prisma) => {
        // Create the user first
        const newUser = await prisma.user.create({
          data: {
            clerkId: userDto.clerkId,
            name: userDto.name,
            email: userDto.email,
            username: userDto.username,
            about: userDto.about,
            image: userDto.image,
            fcmtoken: userDto.fcmtoken,
          },
        });

        // Process categories and interests if provided
        if (userDto.categories && Object.keys(userDto.categories).length > 0) {
          for (const [categoryName, interests] of Object.entries(userDto.categories)) {
            console.log(`Creating category ${categoryName} with interests:`, interests);
            
            // Create the category
            const category = await prisma.category.create({
              data: {
                name: categoryName as CategoryEnum,
                userId: newUser.id,
                weight: 1, // Default weight
              },
            });

            // Create interests for this category if any
            if (interests && interests.length > 0) {
              for (const interestName of interests) {
                console.log(`Adding interest ${interestName} to category ${categoryName}`);
                await prisma.interest.create({
                  data: {
                    name: interestName as InterestEnum,
                    weight: 1, // Default weight
                    categoryId: category.id,
                  },
                });
              }
            } else {
              console.log(`No interests provided for category ${categoryName}`);
            }
          }
        }

        // Return the created user with categories and interests
        return await prisma.user.findUnique({
          where: { id: newUser.id },
          include: {
            categories: {
              include: {
                interests: true,
              },
            },
          },
        });
      });
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          throw new ConflictException(
            `User with this ${error.meta?.target} already exists.`,
          );
        }
      }

      // Handle other unexpected errors
      throw new InternalServerErrorException(
        'Something went wrong while creating the user.',
      );
    }
  }

  async updateUserCategories(userId: string, categories: Record<CategoryEnum, InterestEnum[]>) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete existing categories and their interests for the user
      await this.prisma.category.deleteMany({
        where: { userId: user.id },
      });

      // Create new categories and interests
      for (const [categoryName, interests] of Object.entries(categories)) {
        const category = await this.prisma.category.create({
          data: {
            name: categoryName as CategoryEnum,
            userId: user.id,
            weight: 1, // Default weight
          },
        });

        if (interests && interests.length > 0) {
          for (const interestName of interests) {
            await this.prisma.interest.create({
              data: {
                name: interestName as InterestEnum,
                weight: 1, // Default weight
                categoryId: category.id,
              },
            });
          }
        }
      }

      return await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          categories: {
            include: {
              interests: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating user categories:', error);
      throw new InternalServerErrorException(
        'Something went wrong while updating user categories.',
      );
    }
  }
}
