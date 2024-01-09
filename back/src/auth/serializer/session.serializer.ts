import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { PrismaService } from "src/prisma/prisma.service";
import { Fortytwo_dto } from 'src/auth/dto';
import { sanitize } from "class-sanitizer";


@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async serializeUser(user: Fortytwo_dto, done: (err: Error, user: any) => void): Promise<void> {
    sanitize(user)
    console.log('Serializing user:', user.id, user.login);
    done(null, user);
  }

  async deserializeUser(dto: Fortytwo_dto, done: (err: Error, payload: any) => void): Promise<void> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          fortytwo_id: dto.id,
        },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
