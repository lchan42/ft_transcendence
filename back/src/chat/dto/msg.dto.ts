import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsArray, IsNumber, isNotEmpty, isNumber } from 'class-validator';

export class ChannelMessageSendDto {
	@IsNotEmpty()
	@IsNumber()
	channelId: number;

	@IsNotEmpty()
	@IsString()
	public message: string = "";
}