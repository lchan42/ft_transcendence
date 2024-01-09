import { UserService } from "src/user/user.service";
import {
	Controller,
	Logger,
	Param,
	Get,
	Req,
	UseGuards,
	Res,
	Body,
	Post,
	ParseIntPipe,
} from "@nestjs/common";
//import { ChatMessage, DirectMessage } from "@prisma/client";
import { ChatService } from "src/chat/chat.service";
import { PrismaClient, User } from "@prisma/client";
import { Response } from "express";
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { FrontReqDto, backResInterface } from "src/shared";
import { sanitize } from "class-sanitizer";

@UseGuards(JwtGuard)
@Controller("chat")
export class ChatController {
	private readonly _logger: Logger;
    private readonly _prisma: PrismaClient;

	constructor(
		private chat_service: ChatService,
		private user_service: UserService,
		//private chat_gateway: ChatGateway,
	) {
		this.chat_service = chat_service;
		this.user_service = user_service;
		//this.chat_gateway = chat_gateway;
		this._logger = new Logger(ChatController.name);
	}

	@Get('/channels/')
	async getUserChannels(@Req() req:Request, @GetUser() user: User)
	{
		const dms = await this.chat_service.get__DmUser(user.fortytwo_id);
		const channels = await this.chat_service.get__channelsUserIn(user.fortytwo_id);
		const channels_to_join = await this.chat_service.get__channelsUserCanJoin(user.fortytwo_id);
		const blocked = await this.chat_service.getUserBlocked(user.fortytwo_id);
		// Check if throw error
		let mydms = [];
		dms.forEach((elem:any) => {
			mydms.push({id:elem.id, name:elem.name, members: elem.members, type: elem.type})
		})
		return {data: {channels: {MyDms:mydms, MyChannels:channels, ChannelsToJoin:channels_to_join}}, blockedUser: blocked};
		// return {data: {MyDms:mydms, MyChannels:channels, ChannelsToJoin:channels_to_join}};
	}

	@Get('/channels/:id/name')
	async getChannelName(@Param("id") id: string)
	{
		const channel_name = await this.chat_service.get__chanNamebyId(parseInt(id));
		return channel_name;
	}

	@Get('/channels/:id/isprotected')
	async getChannelsProtection(@Req() req:Request, @Param("id") id: string)
	{
		const pwd = await this.chat_service.getChannelProtection(parseInt(id));
		const userIsInChan = await this.chat_service.userIsInChan(req.headers["authorization"],parseInt(id));
		if (userIsInChan)
			return false;
		if (pwd.password === '' || pwd.password === null || pwd.password === undefined)
			return false;
		return true;
	}

	@Get('/channels/:id/isAdmin')
  async getIsAdmin(@Req() req: Request, @Param("id") id: string) {
    const user = await this.chat_service.getUsername(req.headers["authorization"])
    const idChan: number = parseInt(id);
    const channel = await this.chat_service.getChannelById(idChan);

    if (!channel || !user)
      return false;
    if (channel.admins.find((admin: User) => admin.fortytwo_id === user.fortytwo_id) !== undefined)
      return true;
    return false;
  }

  @Get('/channels/users/:id')
  async getChannelUsers(@Req() req: Request, @Param("id") id: string) {
    const idChan: number = parseInt(id);
    const channel = await this.chat_service.getChannelById(idChan);
    const user = await this.chat_service.getUsername(req.headers["authorization"])
    if (!channel || !user)
      return { status: "none" };
    if (channel.admins.find((admin: User) => admin.fortytwo_id === user.fortytwo_id) !== undefined) {
      return { status: "admin", isDM: channel.isDM, admins: channel.admins, members: channel.members, muted: channel.muted, banned: channel.banned };
    }
    if (channel.members.find((member: User) => member.fortytwo_id === user.fortytwo_id) !== undefined
      || channel.muted.find((mutedUser: User) => mutedUser.fortytwo_id === user.fortytwo_id) !== undefined
    ) {
      return { status: "member", isDM: channel.isDM, admins: channel.admins, members: channel.members, muted: channel.muted, banned: channel.banned };
    }
    return { status: "none" };
  }

	@Get('/channels/:id/msg')
	async getChannelMessages(@Req() req:Request,@Param("id") id : string, @Res() res: Response)
	{
		const idChan : number = parseInt(id);
		const isInChan = await this.chat_service.userIsInChan(req.headers["authorization"], idChan);
		const blockedUser = await this.chat_service.getUserBlocked(req.headers["authorization"]);
		if (isInChan)
		{
			const messages = await this.chat_service.get__MsgIn(idChan, blockedUser);
			return res.status(200).json(messages[0].messages);
		}
		return res.status(403).json({message:"You are not in this channel"});
	}

	@Get('/channels/:id/peopletoinvite')
	async getChannelPeopleToInvite(@Req() req:Request,@Param("id") id:number)
	{
		let chatId:number = Number(id);
		const peopleToInvite = await this.chat_service.getPeopleToInvite(req.headers["authorization"],chatId);
		return peopleToInvite.filter((value:any) => value !== undefined);
	}

	@Get('/channels/users/ban/:id')
	async getChannelUsersBan(@Param("id") id : string)
	{
		const users = await this.chat_service.getUserBanIn(parseInt(id));
		return users[0].banned;
	}

	@Get('/Dm/users')
	async	getUsersToDM(@Req() req:Request){
		const listUsers = await this.chat_service.getUserToDm(req.headers["authorization"])
		return (listUsers);
	}

	@Get('/friends/') // Front do not use get friends anymore
	async getUserFriends(@GetUser() user: User) : Promise<backResInterface>{
		const friends = await this.chat_service.getUserFriends(user.pseudo);
		const goodFormat = friends.map(friend => ({
			// id: friend.fortytwo_id,	//todo : id has been removed because it could be used as a channel id (also in notifyNewFriendAdded)
			name: friend.pseudo,
			connected: friend.connected,
			type: "MyDms",
			members:[
				{id : user.fortytwo_id, name: user.pseudo},
				{id : friend.fortytwo_id, name: friend.pseudo}
			]
		}));
		return {data: goodFormat};
	}

	@Post('addFriend')
	@UseGuards(JwtGuard)
	async addFriend(@GetUser() user: User, @Body() body: FrontReqDto): Promise<backResInterface> {
		sanitize(body);
		return this.chat_service.addFriends(user, body.pseudo);
	}

	@UseGuards(JwtGuard)
	@Post('unblockUser/:id')
	async blockUser(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<backResInterface> {
		return this.chat_service.unblockUser(user, id);
	}

	// @Get('/del/:id')
	// async deleteUser(@Param('id', ParseIntPipe) id: number) {
	//   return this.userService.delId(id)
	// }


	@Get('/chatWindow/:id')
	@UseGuards(JwtGuard)
	async getChannelWindow(@Param("id", ParseIntPipe) id: number, @GetUser() user: User)
	{
		return {data : await this.chat_service.getChatWindow(id, user) };
	}

	@Get('/chatWindowHistory/:id')
	@UseGuards(JwtGuard)
	async getChatWindowHistory(@Param("id", ParseIntPipe) id: number, @GetUser() user: User)
	{
		return {data : await this.chat_service.getChatWindowHistory(id, user) };
	}

	//debug to delete before correction
	@Get('print')
	async printAllChannels(){
		const channels = await this.chat_service.printAllChannels();
		return channels.length!==0 ? channels : "no channels yet\n"
	}

	@Post('/channels/:id/checkPassword')
	@UseGuards(JwtGuard)
	async checkPassword(@Param("id", ParseIntPipe) id: number, @Body() body: FrontReqDto): Promise<backResInterface> {
		sanitize(body)
		return this.chat_service.checkPassword(id, body.password);
	}
}

