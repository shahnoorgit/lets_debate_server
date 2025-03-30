import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { CategoryEnum, InterestEnum } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('username/available')
  async checkUsernameAvailability(@Query('username') username: string) {
    if (!username) {
      return { available: false, message: 'Username is required' };
    }
    
    const isAvailable = await this.userService.isUsernameAvailable(username);
    return { available: isAvailable };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log('Finding user with ID:', id);
    return this.userService.findById(id);
  }

  @Post()
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
}
