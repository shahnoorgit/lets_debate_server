import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { CategoryEnum, InterestEnum, User } from '@prisma/client';
import { Public } from 'src/comman/decorators/public.decorator';
import { UpdateUserPreferencesDto } from './dto/user-preference.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('username/available')
  @Public()
  async checkUsernameAvailability(@Query('username') username: string) {
    if (!username) {
      return { available: false, message: 'Username is required' };
    }

    const isAvailable = await this.userService.isUsernameAvailable(username);
    return { available: isAvailable };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    console.log('Finding user with ID:', id);
    return this.userService.findById(id);
  }

  @Post()
  @Public()
  async createUser(@Body() userDto: CreateUserDto) {
    return this.userService.createUser(userDto);
  }

  @Put(':id/categories')
  async updateUserCategories(
    @Param('id') id: string,
    @Body() categories: Record<CategoryEnum, InterestEnum[]>,
  ) {
    return this.userService.updateUserCategories(id, categories);
  }

  @Put(':id')
  @Public()
  async updateUserPreferences(
    @Param('id') id: string,
    @Body() data: UpdateUserPreferencesDto,
  ) {
    return this.userService.updateUserPreferences(data);
  }
}
