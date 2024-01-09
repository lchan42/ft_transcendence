import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Res, Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Fortytwo_dto } from './dto';
import { ApiAuthGuard } from './guard/ft_api.guard';
import { GetUser } from './decorator/get-user.decorator';
import { JwtGuard } from './guard';
import { User } from '@prisma/client';
import { SessionAuthGuard } from './guard/session.guard';
import { Request, Response } from 'express';
import {FrontReqDto, backResInterface} from 'src/shared';
import * as process from "process";
import { sanitize } from 'class-sanitizer';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/callback')
  @UseGuards(ApiAuthGuard)
  async redirect(
    @Req() req: { user: Fortytwo_dto; request: Request },
    @Res() res: Response,
  ) {
    sanitize(req.user);
    try {
      const ret: {firstConnection: boolean, isF2Active: boolean} = await this.authService.handleIncommingUser(
        req.user,
        res,
      );
      if (ret.firstConnection) {
        res.redirect(process.env.FRONT_HOME + '/settingslock');
      } else if (ret.isF2Active) {
        res.redirect(process.env.FRONT_HOME + '/twoFA');
      } else {
        res.redirect(process.env.FRONT_HOME + '/');
      }
    } catch (error){
      console.log(error);
    }
  }

  @Post('settingslock')
  @UseGuards(SessionAuthGuard)
  async settingslock(
    @Body() frontReq: FrontReqDto,
    @GetUser() user: User,
    @Res() res: Response,
  ) {
    sanitize(frontReq);
    console.log("sanitized", frontReq);
    try {
      res.status(200).send(await this.authService.postAuthSettings(user, frontReq, res ));
    }
    catch (error) {
      return {message: "error"}
    }
  }

  @Get('checkJwt')
  async checkJwt() {
    return true;
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@Req() req:Request, @Res() res:Response, @GetUser() user: User): any {
    return this.authService.logout(req, res, user);
  }

  // element here for debug need to delete in before correction
  @Get('prisma')
  prismaPrintTable() {
    return this.authService.prismaPrintTable();
  }

  @Get('/is2FA')
  @UseGuards(JwtGuard)
  is2FA(@GetUser() user: User) {
    return user.isF2Active;
  }

  @Get('/twoFA')
  @UseGuards(JwtGuard)
  async twoFA(@GetUser() user: User): Promise<backResInterface> {
    console.log("HERRRRE ROUTE TWOfa")
    return await this.authService.twoFA(user);
  }

  @UseGuards(JwtGuard)
  @Put('/verify')
  async verify(@GetUser() user: User, @Body() body: FrontReqDto): Promise<backResInterface> {
    sanitize(body);
    return this.authService.verify(user, body.codeQRAuth);
  }

  @Get('/test')
  async signinTest( @Res() res: Response,) {
    await this.authService.testAnakin(res)
    res.redirect(process.env.FRONT_HOME + '/');
  }
}
