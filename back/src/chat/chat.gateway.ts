import { map } from 'rxjs';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChannelCreateDto } from './dto/chat.dto';
import { ChannelMessageSendDto } from './dto/msg.dto';
import { ValidationPipe, UsePipes } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { PrismaClient } from '@prisma/client';
import { QuitChanDto, JoinChanDto, ActionsChanDto, BlockUserDto} from "./dto/edit-chat.dto"
import { EditChannelCreateDto } from './dto/edit-chat.dto';
import { IsAdminDto } from './dto/admin.dto';
import * as jwt from 'jsonwebtoken';
import {GetResult} from "@prisma/client/runtime/library";
// import * as redisAdapter from 'socket.io-redis';

// import { backResInterface } from './../shared/shared.interface';

// export interface User {
//   id: number;
//   username: string;
//   email: string;
// }
@UsePipes(new ValidationPipe())
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
  pingTimeout: 24 * 60 * 60 * 1000,
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private clients: { [id: string]: { fortytwo_id: number; fortytwo_userName; pseudo: string; } } = {};

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaClient,
    private readonly userService: UserService,
  ) { }

  async handleConnection(client: Socket): Promise<any> {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        console.log('Token is missing');
        client.disconnect();
        return;
      }

      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (typeof decoded === 'object' && 'sub' in decoded) {
        const userId = decoded.sub;

        const user = await this.prisma.user.findUnique({
          where: {
            fortytwo_id: Number(userId),
          },
          select: {
            fortytwo_id: true,
            fortytwo_userName: true,
            pseudo: true,
            userChannels: true,
            ownedChannels: true,
            friends: true,
          }
        })
        this.clients[client.id] = user;
        console.log("client channel list : ", user.userChannels);

        user.userChannels.forEach(channelId => {
          client.join(channelId.toString());
        });

        user.ownedChannels.forEach(channel => {
          client.join(channel.id.toString());
        });

        user.friends.forEach(friendId => {
          this.emitSignal(friendId,{id: user.fortytwo_id, pseudo: user.pseudo, connected: true}, 'Friend connected' )
          //client.to(friendId.toString()).emit('Friend connected', {id: user.fortytwo_id, pseudo: user.pseudo, connected: true});
        });
        console.log("newSocketConnected : ", user.pseudo, " ", client.id);
      } else {
        console.log('Invalid token');
        client.disconnect();
        return;
      }
    }
    catch (e) {
      console.log(e);
      client.disconnect();
      return;
    }
  }

  async handleDisconnect(client: Socket) {
    // console.log("Disconnect")
    const user = this.clients[client.id];
    if (user) {
      const prismaUser = await this.prisma.user.findUnique({
        where: {
          fortytwo_id: user.fortytwo_id,
        },
        select: {
          friends: true,
        }
      });

      if (prismaUser) {
        prismaUser.friends.forEach(friendId => {
          this.emitSignal(friendId,{id: user.fortytwo_id, pseudo: user.pseudo, connected: false}, 'Friend disconnected' )
          // client.to(friendId.toString()).emit('Friend disconnected', {id: user.fortytwo_id, pseudo: user.pseudo, connected: true});
        });
      }
    }
    //console.log("disconnecting : ", user.pseudo, " ", client.id);
    delete this.clients[client.id];
    client.disconnect();
  }

  @SubscribeMessage('Join Channel')
  async joinOrCreateChannel(
    @MessageBody() data: ChannelCreateDto, /*: { info: ChannelCreateDto },*/
    @ConnectedSocket() client: Socket,
  ) {
    console.log("Join Channel received data = ", data, "socketId = ", client.id, "/n")
    let channel;
    let isChannelCreated = false;

    if (data.id && data.type) {
      channel = await this.chatService.getChannelById(data.id);
    } else {
      channel = await this.chatService.CreateChan(data);
      isChannelCreated = true;
    }
    if (isChannelCreated) {
      if (!channel.isPrivate && !channel.isDM) {
        await (this.chatService.getUpdatedChannelForFront(channel.id, data.type)).then(objToEmit => {
          this.server.emit("Channel Created", objToEmit);
        })
        // this.server.emit("Channel Created", { id: channel.id, name: data.name, members: data.members, type: data.type });
      } else {
        await (this.chatService.getUpdatedChannelForFront(channel.id, data.type)).then(objToEmit => {
          this.server.to(channel.id.toString()).emit("Channel Created", objToEmit);
        })
        // this.server.to(channel.id.toString()).emit("Channel Created", { id: channel.id, name: data.name, members: data.members, type: data.type });
      }
    }
    // Rejoindre le canal
    if (this.clients[client.id] === undefined) {
      this.server.to(client.id).emit("error", "Error refresh the page!!!");
      return;
    }
    const user = await this.userService.getUser(this.clients[client.id].pseudo);
    if (!user)
      return;
    const ret = await this.chatService.join_Chan({ chatId: channel.id }, user);
    if (ret === 0 || ret === 5) {
      client.join(channel.id.toString());
      if (ret !== 5) {
        console.log("checkpoint");
        if (data.id) {
          await this.prisma.channel.update({
            where: { id: channel.id },
            data: {
              members: {
                connect: { fortytwo_id: user.fortytwo_id },
              },
            },
            select : {members : true, id: true, name: true, }
          }).then(async () => {
            await (this.chatService.getUpdatedChannelForFront(channel.id, data.type)).then(channel => {
              console.log("Members: ", channel.members, "\n\n\n");
              channel.members.forEach(member => {
                this.emitSignal(member.id, channel, "NewUserJoin");
              })
            });
          });
        }
      }
      await (this.chatService.getUpdatedChannelForFront(channel.id, data.type)).then(objToEmit => {
        this.server.to(client.id).emit("Channel Joined", objToEmit);
      })
      if (channel.isDM) {
        var client2 = await this.server.fetchSockets().then(
          (sockets) => {
            return sockets.find((socket) => socket.id === this.findSocketIdByUserId(data.members[1].id));
          }
        );
        const otherUser = await this.userService.getUserbyId(data.members[1].id);
        const retOtherUser = await this.chatService.join_Chan({ chatId: channel.id }, otherUser);
        if (retOtherUser === 0 || retOtherUser === 5) {
          client2.join(channel.id.toString());
          if (retOtherUser !== 5)
            this.server.to(channel.id.toString()).emit("NewUserJoin", { username: user.fortytwo_userName, id: user.fortytwo_id, avatarUrl: user.avatar })
        await (this.chatService.getUpdatedChannelForFront(channel.id, data.type)).then(objToEmit => {
          this.server.to(client2.id).emit("Channel Joined", objToEmit);
        })

        }
      }
    }
    else if (ret == 1)
      this.server.to(client.id).emit("error", "NotInvited", data.id);
    else if (ret == 2)
      this.server.to(client.id).emit("error", "Banned", data.id);
    else {
      this.server.to(client.id).emit("error", "This channel does not exist!!!");
    }
  }

  // @SubscribeMessage('create channel')
  // async createChannel(
  //   @MessageBody() data: { info: ChannelCreateDto, pseudo2: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   let channel = await this.chatService.CreateChan(data.info, this.clients[client.id].pseudo, data.pseudo2);
  //   if (!channel.isPrivate && !channel.isDM)
  //     this.server.emit("Channel Created", { name: data.info.chatName, id: channel.id, client_id: client.id });
  //   else
  //     this.server.to(client.id).emit("Channel Created", { name: data.info.chatName, id: channel.id, client_id: client.id });
  //   return;
  // }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: ChannelMessageSendDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("channelId ",  data.channelId, " ", this.clients[client.id].pseudo, " : ", data.message);
    const chat = await this.chatService.newMsg(data, this.clients[client.id].fortytwo_id);
    const except_user = await this.chatService.getExceptUser(data.channelId, this.clients[client.id].fortytwo_id);
    console.log("except_user : ", except_user);
    let except = await this.server.in(data.channelId.toString()).fetchSockets().then((sockets) => {
      let except_user_socket = [];
      sockets.forEach((socket) => {
        if (except_user.some((user) => user.fortytwo_userName === this.clients[socket.id].fortytwo_userName))
          except_user_socket.push(socket.id);
      });
      return except_user_socket;
    });
    if (chat == null)
      return "error";
    // const roomName = data.channelId.toString();
    // let socketsInRoom = this.server.in(roomName).allSockets();
    const ret = this.chatService.replacePropNames(chat, ['fortytwo_id', 'pseudo', 'message'], ['id', 'name', 'content'])
    this.server.to(data.channelId.toString()).except(except).emit("Message Created", ret, data.channelId);
  }

  // @SubscribeMessage('joinNewChannel')
  // async join_chan(
  //   @MessageBody() data: JoinChanDto,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   if (this.clients[client.id] === undefined) {
  //     this.server.to(client.id).emit("error", "Error refresh the page!!!");
  //     return;
  //   }
  //   const user = await this.userService.getUser(this.clients[client.id].fortytwo_userName);
  //   const ret = await this.chatService.join_Chan(data, user);
  //   if (ret === 0 || ret === 5) {
  //     client.join(data.chatId.toString());
  //     if (ret !== 5)
  //       client.to(data.chatId.toString()).emit("NewUserJoin", { username: user.fortytwo_userName, id: user.fortytwo_id, avatarUrl: user.avatar })
  //     this.server.to(client.id).emit("Joined", { chatId: data.chatId });
  //   }
  //   else if (ret == 1)
  //     this.server.to(client.id).emit("error", "NotInvited");
  //   else if (ret == 2)
  //     this.server.to(client.id).emit("error", "Banned");
  //   else if (ret == 3) {
  //     this.server.to(client.id).emit("error", "Wrong password");
  //   }
  //   else {
  //     this.server.to(client.id).emit("error", "This channel does not exist!!!");
  //   }
  // }

  // @SubscribeMessage('JoinChannel')
  // async join(
  //   @MessageBody() data: number,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   if (this.clients[client.id] === undefined)
  //     return;
  //   const user = await this.userService.getUser(this.clients[client.id].fortytwo_userName);
  //   const userIsInChan = await this.chatService.userIsInChan(user.fortytwo_id, data);
  //   if (userIsInChan)
  //     client.join(data.toString());
  //   else {
  //     this.server.to(client.id).emit("error", "You are not in this channel");
  //   }
  // }

  @SubscribeMessage('quit')
  async quit_chan(
    @MessageBody() data: QuitChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined)
      return;

    const userId = this.clients[client.id].fortytwo_id;
    const chatId = data.chatId;

    // const chatInfo = await this.chatService.isDM(chatId);
    // if (chatInfo) {
    //   this.server.to(client.id).emit("DM:quit");
    //   return;
    // }

    const isOwner = await this.chatService.isOwner_Chan(userId, chatId);
    const isAdmin = await this.chatService.isAdmin_Chan(userId, chatId);
    const isPrivate = (await this.chatService.getChannelById(chatId)).isPrivate

    if (isOwner) {
      const newOwner = await this.chatService.findNewOwner(chatId);
      if (newOwner) {
        const channel = await this.chatService.getUpdatedChannelForFront(chatId, "MyChannels");
        channel.members.forEach(member => {
          if (member.id != userId)
            this.emitSignal(member.id, channel, 'new owner');
        })
      } else {
        // no owner found --> delete channel. if != private send to all sockets
        await this.chatService.delChanById(chatId);
        //isPrivate ? this.server.to(client.id).emit("chan deleted", chatId) :
        this.server.emit("chan deleted", chatId);

        return;
      }
    }

    if (isAdmin) {
      await this.chatService.removeAdmin(userId, chatId);
    }
    await this.chatService.quit_Chan(userId, chatId);
    client.leave(chatId.toString());

    await this.chatService.getUpdatedChannelForFront(chatId, "MyChannel").then(channel => {
      console.log("getUpdatedChannelForFront", channel.members);

      this.server.to(client.id).emit("quited", channel);
      this.server.to(chatId.toString()).emit("user leave", channel);
    })
    // TODO: mettre a jour la liste des membre en local front quand il part
  }

  @SubscribeMessage('is-admin')
  async isAdmin_Chan(
    @MessageBody() data: IsAdminDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.channel_id);
    // console.log("is admin: " + isAdmin);
    if (isAdmin)
      this.server.to(client.id).emit("isAdmin", { isAdmin: isAdmin });
    else
      this.server.to(client.id).emit("isAdmin", { isAdmin: isAdmin });
  }

  @SubscribeMessage('invit')
  async inv_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined)
      return;
    const isban = await this.chatService.isBan_Chan(data.userId, data.chatId);
    if (isban)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.invit_Chan(data.userId, data.chatId);
    for (let key in this.clients) {
      if (this.clients[key].fortytwo_id === data.userId) {
        await (this.chatService.getUpdatedChannelForFront(data.chatId, "ChannelsToJoin")).then(objToEmit => {
          this.server.to(key).emit("invited", objToEmit);
        });
        console.log("user invited");
        return;
      }
    }
  }

  @SubscribeMessage('ban')
  async ban_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("ban signal recieved");
    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.ban_Chan(data.userId, data.chatId);
    for (let key in this.clients) {
      if (this.clients[key].fortytwo_id === data.userId) {
        this.server.fetchSockets().then(
          (sockets) => {
            sockets.find((socket) => socket.id === key).leave(data.chatId.toString());
          }
        );
        this.server.to(key).emit("banned", data.chatId );
        break;
      }
    }
    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("ban", objToEmit);
    })

    // this.server.to(data.chatId.toString()).emit("ban", { userId: data.userId });
    console.log("chan banned");
  }

  @SubscribeMessage('unban')
  async unban_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("unban signal recieved");

    if (this.clients[client.id] === undefined)
      return;
    // console.log(data);
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    const isPrivate = await this.chatService.isPrivate(data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.unban_Chan(data.userId, data.chatId);
    // if channel is public/ send unbanned signal to concerned socket
    if (!isPrivate) {
      for (let key in this.clients) {
        if (this.clients[key].fortytwo_id === data.userId) {
          await (this.chatService.getUpdatedChannelForFront(data.chatId, "ChannelsToJoin")).then(objToEmit => {
            this.server.to(key).emit("unbanned", objToEmit);
          })
          // this.server.to(key).emit("unbanned", { chatId: data.chatId });
          break;
        }
      }
    }
    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("unban", objToEmit);
    })
    // this.server.to(data.chatId.toString()).emit("unban", { userId: data.userId });
    // console.log("chan unbanned");
  }

  @SubscribeMessage('kick')
  async kick_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("kick signal recieved");

    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    const isPrivate = await this.chatService.isPrivate(data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.kick_Chan(data.userId, data.chatId);
    for (let key in this.clients) {
      if (this.clients[key].fortytwo_id === data.userId) {
        if (this.clients[key].fortytwo_id === data.userId) {
          this.server.fetchSockets().then(
            (sockets) => {
              sockets.find((socket) => socket.id === key).leave(data.chatId.toString());
            }
          );
        }
        await (this.chatService.getUpdatedChannelForFront(data.chatId, "ChannelsToJoin")).then(objToEmit => {
          this.server.to(key).emit("kicked", objToEmit);
        })
        // this.server.to(key).emit("kicked", { chatId: data.chatId });
        break;
      }
    }
    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("kick", objToEmit);
    })
    // this.server.to(data.chatId.toString()).emit("kick", { id: data.userId });
    console.log("chan kicked");
  }


  @SubscribeMessage('mute')
  async mute_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("mute signal recieved");

    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.mute_Chan(data.userId, data.chatId);

    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("mute", objToEmit);
    })

    // this.server.to(data.chatId.toString()).emit("mute", { userId: data.userId });
    console.log("chan muteed");
  }


  @SubscribeMessage('unmute')
  async unmute_chan(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log("unmute signal recieved");

    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.unmute_Chan(data.userId, data.chatId);

    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("unmute", objToEmit);
    })
    // this.server.to(data.chatId.toString()).emit("unmute", { username: data.userId });
    console.log("chan unmuteed");
  }

  @SubscribeMessage('set-admin')
  async set_admin(
    @MessageBody() data: ActionsChanDto,
    @ConnectedSocket() client: Socket,) {
    if (this.clients[client.id] === undefined)
      return;
    const isAdmin = await this.chatService.isAdmin_Chan(this.clients[client.id].fortytwo_id, data.chatId);
    if (!isAdmin)
      return;
    await this.chatService.set_admin_Chan(data.userId, data.chatId);
    await (this.chatService.getUpdatedChannelForFront(data.chatId, "MyChannels")).then(objToEmit => {
      this.server.to(data.chatId.toString()).emit("set-admin", objToEmit);
    })
    console.log("new admin");
  }

  @SubscribeMessage('update')
  async update_chan(
    @MessageBody() data: EditChannelCreateDto,
    @ConnectedSocket() client: Socket,
  ) {
    const res: number = await this.chatService.update_chan(data);
    if (res == 0) {
      this.chatService.getUpdatedChannelForFront(data.channelid, "MyChannels").then(channel => {
        this.server.to(data.channelid.toString()).emit("password updated", channel);
      })
    }
  }

  @SubscribeMessage('block')
  async blockUser(
    @MessageBody() data: BlockUserDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.userService.getUserbyId(data.id);
    if (user) {
      await this.chatService.blockUser(this.clients[client.id].fortytwo_id, user.fortytwo_id);
      this.server.to(client.id).emit("user blocked", data.id);
    }
  }

  // @SubscribeMessage('play')
  // async playMatchWithFriends(@ConnectedSocket() client: Socket, @MessageBody() data: PlayChanDto) {
  //   const room = await this.chatService.playMatchWithFriends(client, this.clients[client.id].fortytwo_userName, data.chatId, this.server);
  //   setTimeout(async () => {
  //     this.server.to(client.id).emit("NewPartyCreated", room.name);
  //     const msg = await this.chatService.newMsg({ chatId: data.chatId, msg: "Link to Play with me:\n" + `${process.env.FRONTEND_URL}` + "/Game/" + room.name }, this.clients[client.id].fortytwo_id);
  //     this.server.to(data.chatId.toString()).emit("NewMessage", msg);
  //   }, 2000);
  // }


  /* *********************************************************
      * pseudo Update
          - if currentUser exist
            - set a list of unique ids that are in a least in one channel in common with current user
            - send update to all set;
  ***********************************************************/
  @SubscribeMessage('pseudo Update')
  async pseudo_update(
    @ConnectedSocket() client: Socket,
  ) {
    const currentUserId = this.clients[client.id].fortytwo_id;
    const currentUser = await this.prisma.user.findUnique({
      where: {fortytwo_id: currentUserId},
      select: {pseudo: true, connected: true, in_game: true}
    })
    if (currentUser) {
      const idSet = await this.collectChannelMembersIdsSet(currentUserId);
      idSet.forEach(id => {
        this.emitSignal(id, {id: currentUserId, name: currentUser.pseudo, connected:currentUser.connected, in_game: currentUser.in_game }, 'pseudo Update');
      })
    }
  }

  @SubscribeMessage('ingame Update')
  async ingame_update(
      @ConnectedSocket() client: Socket,
  ) {
    console.log("INGAME UPDATE...\n\n\n")
    const currentUserId = this.clients[client.id].fortytwo_id;
    this.prisma.user.findUnique({
      where: {fortytwo_id: currentUserId},
      select: {pseudo: true, connected: true, in_game: true, friends: true}
    }).then((user) => {
      user.friends.forEach(id => {
        this.emitSignal(id, {id: currentUserId, name: user.pseudo, connected:user.connected, in_game:user.in_game }, 'ingame Update');
      })
    })
  }

  /** get a set of userId that has a least a channel in commun with userId */
  async collectChannelMembersIdsSet(userId: number) : Promise<Set<number>> {
    const userGroups = await this.prisma.channel.findMany({
      where: {members: { some: { fortytwo_id: userId } },},
      select: {members: {select: {fortytwo_id: true, connected:true}},},
    });
    // declare a clean Set (container that only accept unique values) to store our list of Ids.
    // const idsSet = new Set<number>;
    const idsSet = new Set<number>();
    // forEach: add only fortytwo_id into idsSet
    userGroups.map(group => {
      group.members
        // .filter(member => member.fortytwo_id === userId && member.connected) (commented: userId should be part of emit group)
        .forEach(member => idsSet.add(member.fortytwo_id))
    })
    return idsSet;
  }

  private findSocketIdByUserId(userId: number): string | undefined {
    return Object.keys(this.clients).find((id) => this.clients[id]?.fortytwo_id === userId);
  }

  async emitSignal(userId: number, obj: any, signal: string) {
    const userSocketId = this.findSocketIdByUserId(userId)

    if (userSocketId) {
      this.server.to(userSocketId).emit(signal,  obj);
    }
  }



  // async addFriends(me: User, friendPseudo: string): Promise<backResInterface> {
  //   const meFriends = (await this.prisma.user.findUnique({
  //     where: { fortytwo_id: me.id },
  //     select: { friends: true }
  //   })).friends;
  //   const friendId = (await this.prisma.user.findFirst({
  //     where: { pseudo: friendPseudo },
  //     select: { fortytwo_id: true }
  //   })).fortytwo_id;

  //   if (!meFriends?.find(meFriend => meFriend === friendId) && me.id != friendId) {
  //     const mePrisma = await this.prisma.user.update({
  //       where: { fortytwo_id: me.id },
  //       data: { friends: { push: friendId } }
  //     });
  //     console.log("addfriends result : ", mePrisma.friends);

  //     const friend = await this.userService.getUserbyId(friendId);
  //     this.server.to(this.clients[me.id]).emit("New Friends", { friend });

  //     return { isFriend: true };
  //   } else if (me.id != friendId) {
  //     console.log('you can not friend yourself\n');
  //   } else {
  //     console.log('already friend\n');
  //   }
  //   return { isFriend: false };
  // }
}
