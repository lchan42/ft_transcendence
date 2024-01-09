import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class EditChannelCreateDto {
	@IsNumber()
	channelid?: number;

	@IsOptional()
	@IsBoolean()
	isPassword?: boolean;

	@IsString()
	@IsOptional()
	Password?: string;

	@IsNumber()
	userId?: number;
}

export class QuitChanDto {
	@IsNumber()
	chatId?: number;
}

export class PlayChanDto {
	@IsNumber()
	chatId?: number;
}

export class BlockUserDto {
	@IsNumber()
	id?: number;
}

export class ActionsChanDto {
	@IsNumber()
	chatId?: number;

	@IsNumber()
	userId?: number;
}

export class JoinChanDto {
	@IsNumber()
	chatId?: number;

	// @IsTrue()
	// @IsOptional()
	// isPrivate?: boolean;

	@IsString()
	@IsOptional()
	Password?: string;

	// @IsString()
	// @IsOptional()
	// PasswordConfirmation?: string;
}