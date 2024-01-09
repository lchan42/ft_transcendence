import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelCreateDto } from './dto/chat.dto';
import { ChannelMessageSendDto } from './dto/msg.dto';
import { UserService } from 'src/user/user.service'
import { Channel, User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { JoinChanDto, EditChannelCreateDto } from 'src/chat/dto/edit-chat.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ChatGateway } from './chat.gateway';
import {backResInterface} from "../shared";
import { promises } from 'dns';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly auth: AuthService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway
  ) { }

  async getUserFriends(pseudo: string) {
    const user = await this.prisma.user.findFirst({
      where: { pseudo: pseudo },
      select: { friends: true }
    });

    if (!user) {
      throw new Error('User not found');
    }
    console.log("service getUserFriends: printing user.friends \n", user.friends);
    const friends = await this.prisma.user.findMany({
      where: { fortytwo_id: { in: user.friends.map(Number) } },
      select: { pseudo: true, connected: true, fortytwo_id: true }
    });
    console.log("service getUserFriends: printing friends \n", friends);
    return friends
    // return friends.map(friend => friend.pseudo);
  }

  async getUserByPseudo(pseudo: string) {
    const users = await this.prisma.user.findMany({
      where: {
        pseudo: pseudo,
      }
    });
    return users[0];
  }

  async CreateChan(info: ChannelCreateDto) {
    console.log("creatchannel function is called\n")
    var members = info.members;
    let hash = null;
    info.isPassword = false;
    if (info.password != null && info.password != undefined && info.password != "") {
      const salt = crypto.randomBytes(16).toString('hex');
      hash = await bcrypt.hash(info.password, 10);
      info.isPassword = true;
    }

    if (info.isPrivate === undefined)
      info.isPrivate = false;

      const channel = await this.prisma.channel.create({
        data: {
          name: info.name,
          password: hash,
          isPrivate: info.isPrivate,
          isPassword: info.isPassword,
          isDM: members.length == 2 ? true : false,
          owner: {
            connect: { fortytwo_id: members[0].id }
          },
          admins: {
            connect: members.map(member => ({
              fortytwo_id: member.id,
            }))
          },
          members: {
            connect: members.map(member => ({
              fortytwo_id: member.id,
            }))
          },
          muted: {},
          banned: {},
        },
        include: {
          admins: true,
          members: true,
          owner: true,
          muted: true,
          banned: true,
        },
      });
    return channel;
  }

  async delChanById(id: number) {
    // delete all messages that are linked to channel
    await this.prisma.message.deleteMany({
      where: {
        channelId: id,
      },
    });
    // delete channel
    await this.prisma.channel.delete({
      where: {
        id: id,
      },
    });
  }

  async quit_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    // remove id from channel list
    await this.prisma.user.update({
      where: {
        fortytwo_id: userId,
      },
      data: {
        userChannels : {
          set : user.userChannels.filter(userChannelId => userChannelId !== id),
        }
      }
    });
    // remove user from channel
    const value = await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        members: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }

  async invit_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        invited: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }

  async ban_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const channel = await this.prisma.channel.findUnique({
      where: {
        id: id,
      },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }
    if (channel.ownerId === user.fortytwo_id) {
      return;
    }
    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        admins: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        members: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        muted: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        banned: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
    const newUserChannels = user.userChannels.filter(channelId => channelId !== id);

    await this.prisma.user.update({
      where: {
        fortytwo_id: userId,
      },
      data: {
        userChannels: newUserChannels,
      },
    });
  }

  async unban_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        banned: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        members: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
    await this.prisma.user.update({
      where: {
        fortytwo_id: userId,
      },
      data: {
        userChannels: {
          set: [...user.userChannels, id],
        },
      },
    });
  }

  async kick_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        admins: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        members: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
        muted: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }


  async mute_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        muted: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }

  async set_admin_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        admins: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }



  async unmute_Chan(userId: number, id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.prisma.channel.update({
      where: {
        id: id,
      },
      data: {
        muted: {
          disconnect: {
            fortytwo_id: user.fortytwo_id,
          },
        },
      },
    });
  }

  async join_Chan(data: JoinChanDto, user: User) {
    const isInChan = await this.userIsInChan(user.fortytwo_id, data.chatId);
    if (isInChan)
      return (5);
    const chan = await this.prisma.channel.findUnique({
      where: {
        id: data.chatId,
      },
      select: {
        isPrivate: true,
        isPassword: true,
        banned: true,
        password: true,
        invited: true,
      }
    })
    if (chan === null)
      return (4);
    const isban = chan.banned.find(banned => banned.fortytwo_id == user.fortytwo_id)
    const isinvit = chan.invited.find(invited => invited.fortytwo_id == user.fortytwo_id)
    const isPriv = chan.isPrivate;
    if (isPriv || isban) {
      if (isPriv && !isinvit)
        return (1);
      else if (isban)
        return (2);
    }
    await this.prisma.user.update(
      {
        where: {
          fortytwo_id: user.fortytwo_id,
        },
        data: {
          userChannels: {
            push: data.chatId,
          },
        },
      }
    )

    if (isinvit)
      await this.prisma.channel.update(
        {
          where: {
            id: data.chatId,
          },
          data: {
            invited: {
              disconnect: {
                fortytwo_id: user.fortytwo_id,
              },
            },
          },
        }
      )
    return (0);
  }

  async isBan_Chan(userId: number, id: number) {
    const chan = await this.prisma.channel.findFirst({
      where: {
        id: id,

      },
      select: {
        banned: true,
      }
    })
    const isban: User = chan.banned.find(banned => banned.fortytwo_id == userId)
    if (isban)
      return (true)
    else
      return (false)
  }

  async isAdmin_Chan(userId: number, id: number) {
    return this.prisma.channel.findUnique({
      where: {
        id: id,
      },
      select: {
        admins: true,
      }
    }).then(chan => {
      if (!chan) {
        console.log("chan not found");
        return false;
      }
      const isad: User = chan.admins.find(admins => admins.fortytwo_id == userId)
      if (isad)
        return (true)
      else
        return (false)
    })

  }

  async removeAdmin(userId: number, chatId: number) {
    await this.prisma.channel.update({
      where: {
        id: chatId,
      },
      data: {
        admins: {
          disconnect: {
            fortytwo_id: userId,
          },
        },
      },
    });
  }

  async isOwner_Chan(userId: number, id: number) {
    const chan = await this.prisma.channel.findFirst({
      where: {
        id: id,
        ownerId: userId,
      },
    });

    return chan !== null;
  }

  async isPrivate(chatId: number) : Promise <boolean>{
    const chan = await this.prisma.channel.findUnique({
      where: {
        id: chatId,
      },
      select: {
        isPrivate: true,
      }
    });

    return chan ? chan.isPrivate : false;
  }

  async findNewOwner(chatId: number): Promise<User | null> {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: chatId,
      },
      include: {
        members: true,
      },
    });
    if (!channel) {
      return null;
    }
    for (const member of channel.members) {
      if (member.fortytwo_id !== channel.ownerId) {
          await this.updateOwner(chatId, member.fortytwo_id);
          return member;
        }
      }
    return null;
    }

  async updateOwner(chatId: number, newOwnerId: number): Promise<void> {
    await this.prisma.channel.update({
      where: {
        id: chatId,
      },
      data: {
        ownerId: newOwnerId,
      },
    });
  }

  async newMsg(info: ChannelMessageSendDto, userId: number) {
    const channelid = info.channelId;
    const user =  await this.prisma.user.findUnique({ where: {fortytwo_id: userId,}})
    if (!user) {
      throw new Error(`User with pseudo ${userId} not found`);
    }
    const isInChan = await this.userIsInChan(user.fortytwo_id, channelid);
    const isMuted = await this.userIsChanMuted(user.fortytwo_id, channelid);
    if (!isInChan || isMuted) {
      return (null);
    }
    const message = await this.prisma.message.create({
      data: {
        owner: {
          connect: {
            fortytwo_id: user.fortytwo_id,
          }
        },
        channel: {
          connect: {
            id: info.channelId,
          }
        },
        message: info.message,
      },
      select: {
        id: true,
        owner: {
          select: {
            fortytwo_id: true,
            pseudo: true,
          }
        },
        message: true,
      }
    });

    return (message);
  }

  async get__channelsUserCanJoin(userId: number) {
    try {
      const sources = await this.prisma.channel.findMany({
        where: {
          OR: [
            {
              isPrivate: false
            },
            { invited: { some: { fortytwo_id: userId } } },
          ],
          AND: {
            members: { none: { fortytwo_id: userId } },
            banned: { none: { fortytwo_id: userId } },
          }
        },
        select: {
          id: true,
          name: true,
          members: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          admins: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          owner: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          muted: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          banned: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          isPrivate: true,
          isPassword: true,
        },
      });
      const modifiedSources = this.get__modifiedSource(sources, "ChannelsToJoin")
      return modifiedSources;
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async get__channelsUserIn(userId: number) {
    try {
      const sources = await this.prisma.channel.findMany({
        where: {
          members: { some: { fortytwo_id: userId } },
          isDM: false,
        },
        select: {
          id: true,
          name: true,
          members: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          admins: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          owner: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          muted: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          banned: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          isPrivate: true,
          isPassword: true,
        },
      });
      const modifiedSources = this.get__modifiedSource(sources, "MyChannels")
      return modifiedSources;
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async get__DmUser(userId: number) {
    try {
      const sources = await this.prisma.channel.findMany({
        where: {
          members: { some: { fortytwo_id: userId } },
          isDM: true,
        },
        select: {
          id: true,
          name: true,
          members: { select: { fortytwo_id: true, pseudo: true, connected: true, in_game: true,}},
          admins: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          owner: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          muted: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          banned: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
          isPassword: true,
          isPrivate: true,
        },
      });
      const modifiedSources = this.get__modifiedSource(sources, "MyDms")
      return modifiedSources;
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async get__allUserInchan(id: number) {
    try {
      const source = await this.prisma.channel.findUnique({
        where: {
          id: id,
        },
        select: {
          members: true,
        },
      });
      return source.members;
    } catch (error) {
      console.log('get__user error:', error);
    }
  }

  organize__channelToJoin(source: any) {
    const channels = [];
    // console.log("source : ", source)
    // console.log("name : ", source.name)
    // console.log("source size : ", source.contains)
    // console.log("member : ", source.member)

    return channels;
  }

  async get__UserIn(idChan: number) {
    const users = await this.prisma.user.findMany({
      where: {
        fortytwo_id: idChan,
      },
    });
    return users;
  }

  async get__chanNamebyId(id: number) {
    try {
      const source = await this.prisma.channel.findUnique({
        where: {
          id: id,
        },
        select: {
          name: true,
        },
      });
      return source
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async getChannelById(idChan: number) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: idChan,
      },
      include: {
        admins: true, // include 'admins' in the query
        members: true, // include 'members' in the query
        muted: true, // include 'muted' in the query
        banned: true, // include 'banned' in the query
      },
    });
    return channel;
  }

  async getChannelProtection(id: number) {
    try {
      const source = await this.prisma.channel.findUnique({
        where: {
          id: id,
        },
        select: {
          password: true,
          members: true,
        },
      });
      return source
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async get__MsgIn(idChan: number, blockedUser: number[]) {
    const messages = await this.prisma.channel.findUnique({
      where: {
        id: idChan,
      },
      include: {
        messages: true, // include 'messages' in the query
      },
    });
    return messages;
  }

  async getUserBanIn(id: number) {
    try {
      const source = await this.prisma.channel.findMany({
        where: {
          id: id,
        },
        select: {
          banned: true,
        },
      });
      return source;
    } catch (error) {
      console.log('get__channels error:', error);
    }
  }

  async update_chan(info: EditChannelCreateDto) {
    const idchat = info.channelid;

    if (await this.isOwner_Chan(info.userId, info.channelid) == true) {
      let updateData = {};

      if (info.isPassword === true && info.Password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await bcrypt.hash(info.Password, 10);
        updateData = {
          isPassword: true,
          password: hash,
        };
      } else if (info.isPassword === false) {
        updateData = {
          isPassword: false,
          password: null,
        };
      }

      await this.prisma.channel.update({
        where: {
          id: idchat,
        },
        data: updateData,
      });
      return 0;
    } else {
      return 2;
    }
  }

  async userIsInChan(fortytwo_id: number, id_channel: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: fortytwo_id
      },
      select: {
        members: true
      }
    });

    if (!user) {
      throw new Error(`User with fortytwo_id ${fortytwo_id} not found`);
    }

    for (let i = 0; i < user.members.length; i++) {
      if (user.members[i].id === id_channel)
        return true;
    }
    return false;
  }

  async userIsChanMuted(fortytwo_id: number, id_channel: number): Promise<boolean> {
    const channels = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: fortytwo_id
      },
      select: {
        muted: true
      }
    })
    for (let i = 0; i < channels.muted.length; i++) {
      if (channels.muted[i].id === id_channel)
        return true;
    }
    return false;
  }

  async getUsername(token: string) {
    return this.prisma.user.findUnique({
      where: {
        fortytwo_id: Number(token),
      },
      select: {
        fortytwo_userName: true,
        fortytwo_id: true,
      },
    });
  }

  async getPeopleToInvite(token: string, channelId: number) {
    const friends = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: Number(token),
      },
      select: {
        friends: true,
      },
    });

    const userToInvite = friends.friends.map(async (id_user: number) => {
      const user = await this.prisma.user.findUnique({
        where: {
          fortytwo_id: id_user,
        },
        select: {
          fortytwo_userName: true,
          admins: {
            select: {
              id: true,
            }
          },
          members: {
            select: {
              id: true,
            }
          },
          muted: {
            select: {
              id: true,
            }
          },
          banned: {
            select: {
              id: true,
            }
          },
        },
      });
      if (user.admins.find((elem: any) => { return elem.id === channelId }) === undefined &&
        user.members.find((elem: any) => { return elem.id === channelId }) === undefined &&
        user.muted.find((elem: any) => { return elem.id === channelId }) === undefined &&
        user.banned.find((elem: any) => { return elem.id === channelId }) === undefined
      ) {
        return user.fortytwo_userName;
      }
      return;
    })
    return Promise.all(userToInvite);
  }

  async getUserToDm(token: string) {
    const useralreadydm = await this.prisma.channel.findMany({
      where: {
        members: {
          some: { fortytwo_id: Number(token) }
        },
        isDM: true,
      },
      select: {
        members: {
          where: {
            NOT: { fortytwo_id: Number(token) }
          },
          select: {
            fortytwo_userName: true,
          }
        }
      }
    })

    // console.log(useralreadydm);
    let usernames = [];
    if (useralreadydm.length > 0) {
      useralreadydm[0].members.forEach((value: any) => {
        usernames.push(value.username);
      })
    }
    const users = await this.prisma.user.findMany({
      where: {
        AND: {
          fortytwo_userName: {
            notIn: usernames,
          },
          NOT: { fortytwo_id: Number(token) }
        }
      },
      select: {
        fortytwo_userName: true,
      }
    })
    // console.log(users);
    let values = []
    users.forEach((value: any) => {
      values.push(value.username);
    })
    return (values);
  }

  async createDmChannel(username1: string, username2: string) {
    const channel = await this.prisma.channel.create({
      data: {
        name: username1 + "," + username2,
        password: '',
        isPrivate: true,
        isDM: true,
        owner: {
          connect: { fortytwo_userName: username1 }
        },
        admins: {
          connect: [{ fortytwo_userName: username1 }, { fortytwo_userName: username2 }]
        },
        members: {
          connect: [{ fortytwo_userName: username1 }, { fortytwo_userName: username2 }]
        }
      }
    });
    return channel;
  }

  async isDM(channelId: number) {
    const value = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      select: {
        isDM: true,
      }
    })
    return value.isDM;
  }


  async blockUser(token: number, id_user: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: Number(token),
      },
      select: {
        blocked: true,
      }
    })
    if (user.blocked.find((elem: any) => { return elem === id_user }) === undefined) {
      await this.prisma.user.update({
        where: {
          fortytwo_id: Number(token),
        },
        data: {
          blocked: {
            push: id_user,
          },
        },
      });
      return true;
    }
    return false;
  }

  async getUserBlocked(userId: number) {
    const usersBlocked = await this.prisma.user.findUnique({
      where: {
        fortytwo_id: userId,
      },
      select: {
        blocked: true,
      }
    })
    return usersBlocked.blocked;
  }

  async getExceptUser(channelId: number, id_user: number) {
    const users = await this.prisma.user.findMany({
      where: {
        blocked: {
          has: id_user,
        },
        OR: [
          { ownerId: channelId },
        ],
      },
      select: {
        fortytwo_userName: true,
      }
    });
    return users;
  }

  async checkPassword(id: number, password: string): Promise<backResInterface> {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: id,
      }
    });
    try {
      const result: boolean = await bcrypt.compare(password, channel.password);
      console.log("RESUUUUUUUULT: ", result);
      return {passwordOk: result};
    } catch (error) {
      console.log(error);
      return {passwordOk: false};
    }
  }

  private membershipCheck(chanMembers: {pseudo: string}[], userName: string){
      return chanMembers.find(member => member.pseudo === userName) ? true : false;
  }

  // private modifySource<T extends object>(sources: T[]): T[] {
  //   return sources.map(source => {
  //     if ('fortytwo_id' in source) {
  //       const {fortytwo_id, ... rest} = source;
  //       return {id: fortytwo_id, ... rest} as T;
  //     }
  //     if ('pseudo' in source) {
  //       const {pseudo, ... rest} = source;
  //       return {name: pseudo, ... rest} as T;
  //     }
  //     return source
  //   })
  // }

  // recursively find if a prop name (ex: fortytwo_id) is in obj
  private isPropInObj(obj: any, prop: string): boolean {
    if (obj.hasOwnProperty(prop))
      return true;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.isPropInObj(obj[key], prop)) {
          return true;
        }
      }
    }
    return false;
  }

  // find prop in source and replace it by newprop
  private replacePropName <T extends object >(source: T, prop: string, newprop: string): T {
    if (typeof source !== 'object' || source ===null) {
      return source;
    }
    const newSource: any = {}
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (key === prop) {
          newSource[newprop] = source[key];
        } else if (typeof source[key] === 'object' && source[key] !== null) {
          newSource[key] = this.replacePropName(source[key] as object, prop, newprop);
        } else {
          newSource[key] = source[key];
        }
      }
    }
    return newSource;
  }

  // find props in source and replace it by newprops (MULTI)
  replacePropNames<T extends object>(source: T, props: string[], newprops: string[]): T {
  if (typeof source !== 'object' || source === null) {
    return source;
  }

  const newSource: any = {};

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const propIndex = props.indexOf(key);

      if (propIndex !== -1) {
        newSource[newprops[propIndex]] = source[key];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        newSource[key] = this.replacePropNames(source[key] as object, props, newprops);
      } else {
        newSource[key] = source[key];
      }
    }
  }
  return newSource;
}

  async getChatWindow(channelId: number, user: User) {

    const channel = await this.prisma.channel.findUnique({
      where: {
        id:channelId
      },
      select: {
        id: true,
        members: {select: {pseudo: true, fortytwo_id: true}},
        messages: {select:{
          id: true,
          message: true,
          owner:{select:{pseudo: true, fortytwo_id: true}}
        }},
      }
    });
    return (channel && this.membershipCheck(channel.members, user.pseudo))
            ? this.replacePropNames(channel, ['fortytwo_id', 'pseudo'], ['id', 'name'])
            : {}
  }

  async getChatWindowHistory(channelId: number, user: User) {

    const history = await this.prisma.channel.findUnique({
      where: {
        id:channelId
      },
      select: {
        messages: {select:{
          id: true,
          message: true,
          owner:{select:{pseudo: true, fortytwo_id: true}}
        }},
      }
    });
    const reformatHistory = history.messages.map((message) => ({
      id: message.id,
      owner: {id : message.owner.fortytwo_id, name: message.owner.pseudo},
      content: message.message,
    }))
    return reformatHistory
  }

  async createDMChannel(user1Id: number, user2Id: number): Promise<Channel> {
    const channel = await this.prisma.channel.create({
      data: {
        name: `DM-${user1Id}-${user2Id}`,  // Génère un nom unique pour le canal DM
        owner: {
          connect: { fortytwo_id: user1Id },  // Définit l'utilisateur 1 comme propriétaire du canal
        },
        isDM: true,
        isPrivate: true,
        members: {
          connect: [
            { fortytwo_id: user1Id },
            { fortytwo_id: user2Id },
          ],
        },
      },
      include: {
        members: true,
      },
    });

    await this.prisma.user.update({
      where: { fortytwo_id: user1Id },
      data: { userChannels: { push: channel.id } },
    });

    await this.prisma.user.update({
      where: { fortytwo_id: user2Id },
      data: { userChannels: { push: channel.id } },
    });

    return channel;
  }

  async friendshipUpdatePrisma (adder: User, newFriend: User) : Promise<boolean>{
    //if user is not adding him self && friend is not already in my list
    if (adder.fortytwo_id != newFriend.fortytwo_id
        && !adder.friends?.find(friendId => friendId === newFriend.fortytwo_id)) {
        await this.prisma.user.update({
          where: { fortytwo_id: adder.fortytwo_id, },
          data: { friends: { push: newFriend.fortytwo_id,},}
        })
        return true;
    }
    return false;
  }

  async unblockUser(me: User, userBlockId: number): Promise<backResInterface> {
    if (me.fortytwo_id == userBlockId)
      return {isOk: false};
    const unblockUser = await this.prisma.user.findUnique({
      where : {fortytwo_id: userBlockId},
    });
    if (!unblockUser)
      return {isOk: false};
    const updatedBlocked = me.blocked.filter(id => id !== userBlockId);
    await this.prisma.user.update({
      where: {
        fortytwo_id: me.fortytwo_id,
      },
      data: {
        blocked: {
          set: updatedBlocked,
        }
      }
    })
    this.emitSignal(me.fortytwo_id, userBlockId, "unblock user");
    return {isOk: true};
      // signal will be send to  second user if he is connected. So front can send 'join channel'
  }

  async addFriends(me: User, friendPseudo: string): Promise<backResInterface> {
    if (me.pseudo == friendPseudo)
      return {isOk: false};
    const newFriend = await this.prisma.user.findFirst({
      where : {pseudo: friendPseudo},
    })
    if (newFriend.blocked.find(idBlocked => idBlocked == me.fortytwo_id))
      return {isOk: false};
    let status = await this.friendshipUpdatePrisma(me, newFriend);
    status = await this.friendshipUpdatePrisma(newFriend, me);
    if (status) {
      const dmChannel = await this.createDMChannel(me.fortytwo_id, newFriend.fortytwo_id);
      const goodFormatDmChannel = {
        id: dmChannel.id,
        name: dmChannel.name,
        type: "MyDms",
        members:[
        	{id : me.fortytwo_id, name: me.pseudo, connected: me.connected},
        	{id : newFriend.fortytwo_id, name: newFriend.pseudo, connected: newFriend.connected}
        ]
      };
      this.emitSignal(me.fortytwo_id, goodFormatDmChannel, "friendship Created");
      // signal will be send to  second user if he is connected. So front can send 'join channel'
      this.emitSignal(newFriend.fortytwo_id, goodFormatDmChannel, "friendship Created");
    }
    return {isOk: true}
  }

  async emitSignal(targetId: number, obj: any, signal: string) {
    this.chatGateway.emitSignal(targetId, obj, signal)
  }


  async getUpdatedChannelForFront(channelId: number, type: string) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      select: {
        id: true,
        name: true,
        members: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
        admins: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
        owner: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
        muted: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
        banned: {select: {fortytwo_id: true, pseudo: true, connected:true, in_game: true}},
        isPrivate: true,
        isPassword: true,
      },
    });
    const modifiedSources = this.formatFrontProperties(channel, type);
    return modifiedSources;
  }

  //used to reformate other get__ prisma result.
  private get__modifiedSource(sources: any[], type: string) {
    return sources.map((source) => this.formatFrontProperties(source, type));
  };

  private formatFrontProperties(source: any, type: string) {
    return {
      id: source.id,
      name: source.name,
      type: type,
      isPrivate: source.isPrivate,
      isPassword: source.isPassword,
      owner: {
        id: source.owner.fortytwo_id,
        name: source.owner.pseudo,
        connected: source.owner.connected,
        in_game: source.owner.in_game,
      },
      members: source.members.map((member) => ({
        id: member.fortytwo_id,
        name: member.pseudo,
        connected: member.connected,
        in_game: member.in_game,
      })),
      admins: source.admins.map((member) => ({
        id: member.fortytwo_id,
        name: member.pseudo,
        connected: member.connected,
        in_game: member.in_game,
      })),
      banned: source.banned.map((member) => ({
        id: member.fortytwo_id,
        name: member.pseudo,
        connected: member.connected,
        in_game: member.in_game,
      })),
      muted: source.muted.map((member) => ({
        id: member.fortytwo_id,
        name: member.pseudo,
        connected: member.connected,
        in_game: member.in_game,
      })),
    };
  }

  // TODO to delete before correction
  async printAllChannels() {
    try {
		  const channels = await this.prisma.channel.findMany({
        include: {banned: {select: {fortytwo_id: true, pseudo: true}},
        muted: {select: {fortytwo_id: true, pseudo: true}},
                members : {select: {pseudo: true, fortytwo_id: true, messages: true}}}
      })
		  console.log("****** PRINTING ALL CHANNELS ******\n", channels? channels : "channels is undefined");
		  return channels;
		} catch (error) {
		  console.error(error);
		}
  }
}




  // const sources = await this.prisma.channel.findMany({
  //   where: {
  //     members: { some: { fortytwo_id: userId } },
  //     isDM: false,
  //   },
  //   select: {
  //     id: true,
  //     name: true,
  //     members: {select: {fortytwo_id: true, pseudo: true, connected:true}},
  //     admins: {select: {fortytwo_id: true}},
  //     owner: {select: {fortytwo_id: true}},
  //   },
  // });
  // const modifiedSources = sources.map((source) => ({
  //   // ...source,
  //   id: source.id,
  //   name: source.name,
  //   members: source.members.map((member) => ({
  //     id: member.fortytwo_id,
  //     name: member.pseudo,
  //     connected: member.connected,
  //     isAdmin: source.admins.some((admin) => admin.fortytwo_id === member.fortytwo_id),
  //     isOwner: source.owner ? source.owner.fortytwo_id === member.fortytwo_id : false,
  //   })),
  //   type: 'MyChannels',
  // }));


      // const modifiedSources = sources.map((source) => ({
      //   // ...source,
      //   id: source.id,
      //   name: source.name,
      //   members: source.members.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //   })),
      //   type: 'ChannelsToJoin',
      //   isPrivate: source.isPrivate,
      //   isPassword: source.isPassword,
      //   owner: {id: source.owner.fortytwo_id, name: source.owner.pseudo, connected: source.owner.connected, in_game: source.owner.in_game},
      //   admins: source.admins.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //   })),
      // }));

      // const modifiedSources = sources.map((source) => ({
      //   // ...source,
      //   id: source.id,
      //   name: source.name,
      //   members: source.members.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //     isAdmin: source.admins.some((admin) => admin.fortytwo_id === member.fortytwo_id),
      //     isOwner: source.owner ? source.owner.fortytwo_id === member.fortytwo_id : false,
      //   })),
      //   type: 'MyChannels',
      //   isPrivate: source.isPrivate,
      //   isPassword: source.isPassword,
      //   owner: {id: source.owner.fortytwo_id, name: source.owner.pseudo, connected: source.owner.connected, in_game: source.owner.in_game},
      //   admins: source.admins.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //   })),
      // }));


      // const modifiedSources = sources.map((source) => ({
      //   //...source,
      //   id: source.id,
      //   name: source.name,
      //   members: source.members.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //     isAdmin: true,
      //     isOwner: true,
      //   })),
      //   type: 'MyDms',
      //   isPrivate: source.isPrivate,
      //   isPassword: source.isPassword,
      //   owner: {id: source.owner.fortytwo_id, name: source.owner.pseudo, connected: source.owner.connected, in_game: source.owner.in_game},
      //   admins: source.admins.map((member) => ({
      //     id: member.fortytwo_id,
      //     name: member.pseudo,
      //     connected: member.connected,
      //     in_game: member.in_game,
      //   })),
      // }));
