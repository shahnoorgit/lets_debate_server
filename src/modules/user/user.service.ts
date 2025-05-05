import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import { Prisma, CategoryEnum, InterestEnum } from '@prisma/client';
import { UpdateUserPreferencesDto } from './dto/user-preference.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class UserService {
  private readonly ALL_USERNAMES_CACHE_KEY = 'usernames:all';
  private readonly CACHE_TTL_SECONDS = 20000;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findById(id: string) {
    try {
      console.log('Finding user with ID:', id);
      const user = await this.prisma.user.findUnique({
        where: { clerkId: id },
      });

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
      let usernames = (await this.cacheManager.get(
        this.ALL_USERNAMES_CACHE_KEY,
      )) as string[] | null;

      if (!usernames) {
        const users = await this.prisma.user.findMany({
          select: { username: true },
        });

        usernames = users.map((user) => user.username);

        await this.cacheManager.set(
          this.ALL_USERNAMES_CACHE_KEY,
          usernames,
          this.CACHE_TTL_SECONDS,
        );
      }

      return usernames ? !usernames.includes(username) : true;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw new InternalServerErrorException(
        'Error checking username availability',
      );
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

      console.log(
        'Creating user with categories:',
        JSON.stringify(userDto.categories),
      );

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
            expoTokens: [userDto.expoTokens!],
          },
        });

        // Process categories and interests if provided
        if (userDto.categories && Object.keys(userDto.categories).length > 0) {
          for (const [categoryName, interests] of Object.entries(
            userDto.categories,
          )) {
            console.log(
              `Creating category ${categoryName} with interests:`,
              interests,
            );

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
                console.log(
                  `Adding interest ${interestName} to category ${categoryName}`,
                );
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

  async updateUserCategories(
    userId: string,
    categories: Record<CategoryEnum, InterestEnum[]>,
  ) {
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

  async updateUserPreferences(preferences: UpdateUserPreferencesDto) {
    const userId = '23a1a98e-e712-490b-8b6e-d8d16d50289f';
    const { name, type, id } = preferences;

    try {
      // Retrieve the user with related categories and interests
      const user = await this.prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          categories: {
            include: {
              interests: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (type === 'interest') {
        // Find the unique interest by name across all categories for this user.
        const interest = await this.prisma.interest.findUnique({
          where: { id: id },
        });

        if (interest) {
          // Update the interest's weight.
          await this.prisma.interest.update({
            where: { id: interest.id },
            data: { weight: { increment: 1 } },
          });

          // Update the parent category's weight.
          await this.prisma.category.update({
            where: { id: interest.categoryId },
            data: { weight: { increment: 1 } },
          });
        } else {
          throw new NotFoundException(`Interest with name ${name} not found`);
        }
      } else if (type === 'category') {
        // Find the matching category among the user's categories using a case‑insensitive match.
        const matchedCategory = user.categories.find((category) =>
          category.name.toLowerCase().includes(name.toLowerCase()),
        );

        if (matchedCategory) {
          await this.prisma.category.update({
            where: { id: matchedCategory.id },
            data: { weight: { increment: 1 } },
          });
        } else {
          throw new NotFoundException(
            `Category matching name ${name} not found`,
          );
        }
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}
