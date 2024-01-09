
import {backResInterface, FrontReqDto} from './../shared/shared.interface';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { sanitize } from 'class-sanitizer';
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {
  }

  @Get('/me')
  @UseGuards(JwtGuard)
  getMe(@GetUser() user: User) {
    return user;
  }

  @Get('/profil')
  @UseGuards(JwtGuard)
  getProfil(@GetUser() user: User) {
    return this.userService.profil(user);
  }

  @Put('/user')
  @UseGuards(JwtGuard)
  getUser(@Body() body: FrontReqDto) {
    sanitize(body)
    return this.userService.getUser(body.pseudo);
  }

  @Get('/all')
  @UseGuards(JwtGuard)
  async getUsers(): Promise<backResInterface> {
    return await this.userService.getUsers();
  }

  @Put('/checkpseudo')
  async checkpseudo(@Body() body: FrontReqDto) {
    sanitize(body)
    return this.userService.checkPseudo(body.pseudo)
  }

  @Get('/isBlock/:id')
  @UseGuards(JwtGuard)
  async isBlock(@GetUser() me: User, @Param('id', ParseIntPipe) id: number): Promise<backResInterface> {
    return await this.userService.isBlock(me, id);
  }

  @Get('/isFriend/:pseudo')
  @UseGuards(JwtGuard)
  async isFriend(@GetUser() me: User, @Param('pseudo') pseudo: string): Promise<backResInterface> {
    return await this.userService.isFriend(me, pseudo);
  }

  @Post('update')
  @UseGuards(JwtGuard)
  async settingslock(
      @Body() body: FrontReqDto,
      @GetUser() user: User,
  ) {
    sanitize(body)
    return await this.userService.updateUser(user.fortytwo_id, body)
  }

  @Get('/del/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delId(id)
  }

  @Get('/clear')
  async clear() {
    return await this.userService.deleteAllUsers();
  }

  @Get('/print')
  async print() {
    return await this.userService.print();
  }

  @Get('/cleanDb')
  async cleanDb() {
    const ret = await this.userService.cleanDb();
    return ret
  }

  @Get('/fclean')
  async killAllFriendShip() {
    const ret = await this.userService.noFriendshipSpell();
    return ret
  }

  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', 'uploads'),
      filename: (req, file, callback) => {
        callback(null, `${Date.now()}-${file.originalname}`);
      },
    }),
  }))
  async uploadAvatar(@Body() body: FrontReqDto, @GetUser() user: User, @UploadedFile() file) {
    sanitize(body)
    const update: FrontReqDto = {
      ...body,
      avatar: file.filename,
    };
    return await this.userService.updateUser(user.fortytwo_id, update);
  }

  @Get('/avatar/:id')
  async getAvatar(@Param('id') id: string) {
    const avatar = await this.userService.getAvatar(Number(id));
    return this.userService.getAvatar(Number(id));
  }
}
