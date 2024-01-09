import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

interface Photo {
  value: string;
}

export class Fortytwo_dto {
  @IsNotEmpty()
  id: number;
  @IsNotEmpty()
  login: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  image?: Photo[];
}

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  pseudo: string;

  @IsBoolean()
  @IsNotEmpty()
  isF2Active: boolean;

  @IsString()
  @IsNotEmpty()
  avatar: string;
}
