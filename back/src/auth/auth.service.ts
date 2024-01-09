import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto, Fortytwo_dto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';
import { HttpStatus } from '@nestjs/common';
import { FrontReqDto, backResInterface } from 'src/shared';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private user: UserService,
  ) {}
  async handleIncommingUser(incommingUser: Fortytwo_dto, res: Response) {
    let firstConnection: boolean = true;
    const prismaRet = await this.user.getUserbyId(incommingUser.id);

    if (!prismaRet) {
      await this.signup(incommingUser);
    } else if (prismaRet.pseudo !== '') {
      await this.user.toggleConnectionStatus(incommingUser.id, true);
      await this.handleCookies(incommingUser.id, res);
      firstConnection = false;
    }
    return {firstConnection: firstConnection, isF2Active: prismaRet? prismaRet.isF2Active : false};
  }

  async signup(incommingUser: Fortytwo_dto) {
    try {
      const user: User = await this.prisma.user.create({
        data: {
          fortytwo_id: incommingUser.id,
          fortytwo_email: incommingUser.email,
          fortytwo_userName: incommingUser.login,
          fortytwo_picture: incommingUser.image[1]?.value || null,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ForbiddenException('signup : Credentials taken');
      }
      throw error;
    }
  }

  private async handleCookies(id: number, res: Response){
    const token = await this.signToken(id);
    res.cookie('jwtToken', token.access_token);
  }

  private async signToken(userId: number): Promise<{ access_token: string } | null> {
    const data = {
      sub: userId,
    };
    const secret = process.env.JWT_SECRET;
    const token = await this.jwt.signAsync(data, {
      expiresIn: '999m',
      secret: secret,
    });
    return { access_token: token };
  }

  async logout(req: Request, res: Response, user: User): Promise<void> {
      const updatedUser = await this.prisma.user.update({
        where: {
          fortytwo_id: user?.fortytwo_id,
        },
        data: {
          connected: false,
          isF2authenticated : false,
        },
        select: {
          pseudo: true,
          fortytwo_id: true,
          avatar:true,
          connected: true,
          isF2Active: true,
          isF2authenticated: true,
        }
      });
    res.clearCookie(process.env.COOKIES_NAME);
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({isOk: false, message: 'error during logout' });
      } else {
        console.log("user: ", user.pseudo, "successfully disconnected")
        return res.status(200).json({ ...updatedUser, isOk: true, message: 'disconnected' });
      }
    });
  }

  async postAuthSettings(user: User, frontReq: FrontReqDto, res: Response) : Promise<backResInterface>{
    try {
      if (user && !user.pseudo) {
        await this.handleCookies(user.fortytwo_id, res)
        await this.user.toggleConnectionStatus(user.fortytwo_id, true);
        const updatedUser = await this.user.updateUser(user.fortytwo_id, frontReq);
        return updatedUser;
      }
      return {isOk: false};
    } catch (error) {

      return { isOk: false, message: error}
    }
  }

  async twoFA(user: User): Promise<backResInterface> {
    console.log("inside back twoFA user value : ", user);
    // if current user has no secret generated yet generate and add it to db
    if (user.secretOf2FA === "0") {
    console.log("apparentyle user 2fa secret is null ???? ");

      const secret = speakeasy.generateSecret({
        name: user.pseudo,
      });
      await this.prisma.user.update({
        where: {
          fortytwo_id: user.fortytwo_id,
        },
        data: {
          secretOf2FA: secret.base32,
        },
      });
      qrcode.toDataURL(secret.otpauth_url, function (err) {
        if (err) throw err;
      });
      console.log("returning secret.otpauth_url")
      return { qrCodeUrl: secret.otpauth_url };
    }
    // if current user has already a 2fa do not generate a new one
    // else {
    //   return { qrCodeUrl: user.secretOf2FA };
    // }

    // if current user has already a 2fa he Should not get a qrcode
    return {qrCodeUrl: ""}
  }

  // async twoFA(user: User): Promise<backResInterface> {
  //   const secret = speakeasy.generateSecret({
  //     name: user.pseudo,
  //   });
  //   await this.prisma.user.update({
  //     where: {
  //       fortytwo_id: user.fortytwo_id,
  //     },
  //     data: {
  //       secretOf2FA: secret.base32,
  //     }
  //   })
  //   qrcode.toDataURL(secret.otpauth_url, function (err) {
  //     if (err) throw err;
  //   });
  //   return {qrCodeUrl: secret.otpauth_url};
  // }

  async verify(user: User, code: string): Promise <backResInterface> {
    const ret = speakeasy.totp.verify({
      secret: user.secretOf2FA,
      encoding: "base32",
      token: code, });
    if (ret) {
      await this.prisma.user.update({
        where : { fortytwo_id: user.fortytwo_id },
        data: {
          isF2authenticated : true,
        }
      });
    }
    console.log("ret in verify", ret);
    return {verifyQrCode: ret};

    // return {verifyQrCode:  speakeasy.totp.verify({
    //   secret: user.secretOf2FA,
    //   encoding: "base32",
    //   token: code, })};
  }


  //todo delete before correction: this is juste a test

  async creatProfile(dto1 : Fortytwo_dto, dto2: AuthDto ) {
    let user : any = await this.user.getUserbyId(dto1.id)
    console.log("user null ?", user===null ? "YEEEEES": "NOOOOOO")
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fortytwo_id: dto1.id,
          fortytwo_email: dto1.email,
          fortytwo_userName: dto1.login,
          fortytwo_picture: null,
          pseudo: dto2.pseudo,
          avatar: dto2.avatar,
          isF2Active: dto2.isF2Active,
          xp:1000,
          win: 1000,
          connected: true,
        },
      });
    }
    await this.user.toggleConnectionStatus(dto1.id, true);

    return user
  }

  async testAnakin(res: Response) {
    const anakinFortytwo_dto : Fortytwo_dto = {id: 66, login:"Askywalker", email:"Askywalker@42paris.fr"}
    const anakinAuthDto: AuthDto = {pseudo: "Anakin", isF2Active: false, avatar:"/src/images/MGameWatch.png"}
    await this.creatProfile(anakinFortytwo_dto, anakinAuthDto);
    await this.handleCookies(anakinFortytwo_dto.id, res)
  }

  async prismaPrintTable() {
    try {
      const users = await this.prisma.user.findMany();
      console.log(users);
      return users;
    } catch (error) {
      console.error(error);
    }
  }
}

/* reminder : stastus code error
200 OK : Indique que la requête a été traitée avec succès.
201 Created : Indique que la requête a été traitée avec succès et qu'une nouvelle ressource a été créée en conséquence.
204 No Content : Indique que la requête a été traitée avec succès, mais qu'il n'y a pas de contenu à renvoyer dans la réponse.
400 Bad Request : Indique que la requête du client est incorrecte ou malformée.
401 Unauthorized : Indique que l'utilisateur doit être authentifié pour accéder à la ressource demandée, mais l'authentification a échoué ou n'a pas été fournie.
403 Forbidden : Indique que l'utilisateur est authentifié, mais n'a pas les autorisations nécessaires pour accéder à la ressource demandée.
404 Not Found
500 Internal Server Error
*/
