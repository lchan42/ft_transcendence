import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { HttpService } from '@nestjs/axios';
import { Fortytwo_dto } from '../dto/auth.dto';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class ApiStrategy extends PassportStrategy(OAuth2Strategy, 'ft_api') {
  constructor(private readonly httpService: HttpService) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: process.env.UID,
      clientSecret: process.env.API_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ['public'],
    });
  }

  async validate(accessToken: string): Promise<Fortytwo_dto> {
    try {
      const response = await lastValueFrom(
        this.httpService
          .get('https://api.intra.42.fr/v2/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .pipe(map((res) => res.data)),
      );
      const userDto: Fortytwo_dto = {
        id: response.id,
        login: response.login,
        email: response.email,
        image: response.image,
      };
      return userDto;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Unexpected error during validation');
      }
    }
  }
}
