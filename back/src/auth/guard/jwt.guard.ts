import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super({
      //overload of the way to get the token
      jwtGuardwtFromRequest: (request: Request) => {
        return request.cookies.jwtToken;
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const canActivate = await super.canActivate(context);

    if (canActivate) {
        const request: Request = context.switchToHttp().getRequest();

        if (request.user) {
          const { connected } =  request.user as any
      //   const { connected, isF2Active, isF2Authenticated } =  request.user as any
          if (connected)
            return true;
        }
    }
    return false;
  }
}
