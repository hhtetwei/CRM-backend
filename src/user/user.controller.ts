import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorators';
import { JwtGuard } from 'src/guards';
import { RolesGuard } from 'src/guards/roles.guards';
import { UserService } from './user.service';
import { userDto } from 'src/dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createUser(@Body() dto: userDto) {
    return this.userService.createUser(dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SALES_REP', 'SALES_MANAGER')
  @Get('me')
  getMe(@Req() req: any) {
    return {
      user: req.user,
    };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  getUsers() {
    return this.userService.getUsers();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser(+id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() userDto: userDto) {
    return this.userService.update(+id, userDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
