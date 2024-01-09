import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  pseudo: string;

  @IsOptional()
  avatar: any;

  @IsBoolean()
  isF2Active: boolean;

  @IsOptional()
  friends?: number[];

  @IsOptional()
  win?: number;
}

export class FrontReqDto {
  @IsOptional()
  @IsString()
  pseudo?: string;

  @IsOptional()
  avatar?: any;

  @IsOptional()
  @IsBoolean()
  isF2Active?: boolean;

  @IsOptional()
  @IsNumber()
  fortytwo_id?: string;

  @IsOptional()
  @IsString()
  codeQRAuth?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export interface User {
	pseudo: string;
	avatar: any;
	isF2Active: boolean;
	friends?: number[];
	win?: number;
  }

export interface frontReqInterface {
	pseudo?: string;
	avatar?: any;
	isF2Active?: boolean;
	fortytwo_id?: string;
	codeQRAuth?: string;
	password?: string;
}

export interface IChannel {
	id: number,
	name: string,
	type: string,
  }

export interface IChannels{
	MyDms: IChannel[];
	MyChannels: IChannel[];
	ChannelsToJoin : IChannel[];
  }

  export interface IChatFriend {
	id: number
	name: string
	connected: boolean
  }

  export interface backResInterface {
	pseudo?: string;
	isOk?: boolean;
	message?: string;
	avatar?: any;
	isF2Active?: boolean;
	isF2authenticated?: boolean;
	connected?:boolean;
	fortytwo_id?: number;
	isBlock?: boolean;
	blockedUsers?: number[];
	isFriend?: boolean;
	friends?: number[];
	allUser?: User[];
	isAuthenticated?: boolean;
	channels?: IChannels;
	xp?: number;
	win?: number;
	chatFriends?: IChatFriend[]
	data?: any;
	qrCodeUrl?: string;
	verifyQrCode?: boolean;
	passwordOk?: boolean;
  }
