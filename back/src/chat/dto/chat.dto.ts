import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsArray, IsNumber } from 'class-validator';
import { Tag } from '../chat.type';

export class ChannelCreateDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsNumber()
  @IsOptional()
  id: number;

  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;

  @IsBoolean()
  @IsOptional()
  isPassword: boolean;

  @IsString()
  @IsOptional()
  password: string;

  @IsArray()
  // @IsNumber({}, { each: true })
  @IsOptional()
  members: {name: string, id: number}[];

  @IsString()
  @IsOptional()
  type: string;
}

export class InGameDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  targetId: number;

}
