import React, {ReactNode, createContext, useState, useContext, useEffect, useRef } from 'react';
import { backRequest, backResInterface } from '../api/queries';
import Cookies from 'js-cookie';
import { useUser } from './UserContext';
import { io, Socket } from 'socket.io-client';
import {boolean} from "yup";



// Todo : update channels (change password, name new admin ....)
// Todo : need to handle error event with case : NotInvited, Banned, Wrong password, This channel does not exist!!!

// ban --> a user has been banned
// kicked, banned --> I ve been banned from a channel --> need to close all windows and update channels
// unbanned --> I ve been unbanned from channel //todo put back channel in channels to join ?
// unban // a user has been unbanned  (update channel and windows)
// kicked

  export interface IChatMember {
    name: string;
    id: number;
    connected?: boolean;
    in_game?: boolean;
  }


export interface IChatHistory {
  id: number,
  owner: {
    name: string,
    id: number,
  };
  content: string;
}

export interface IChatWindow extends IChannel{
  history: IChatHistory[];
}

export interface IChannel {
  id: number,
  name: string,
  type: string,
  isPrivate: boolean,
  isPassword: boolean,
  owner: IChatMember,
  members: IChatMember[],
  admins: IChatMember[],
  banned: IChatMember[],
  mute: IChatMember[],
}

type ChannelType = keyof IChannels;
export interface IChannels{
	MyDms: IChannel[];
	MyChannels: IChannel[];
	ChannelsToJoin : IChannel[];
  [key: string]: IChannel[];
  }

export interface IFormData {
  name: string,
  isPrivate: boolean,
  isPassword: boolean,
  password: string,
  members: IChatMember[],
  type: string,
}

export const ChatContext = createContext<{
  socket: Socket | null
  channels: IChannels
  openedWindows: IChatWindow[] | null
  openWindow: (chatData? : IChannel, form?: IFormData, password?: string) => void
  closeWindow: (id: number) => void
  sendMessage: (message: string, channelId: number) => void
  sendAdminForm: (  chatId: number, targetId: number,
                    mute: boolean, unMute: boolean,
                    ban: boolean, unBan: boolean,
                    kick: boolean, admin: boolean,
                    isPassword: boolean, password: string) => void
  addFriendToChannel: (nameToAdd: string, chatId: number) => void
  leaveChannel: (chatId: number) => void
  blockedUsers: number[]
  blockUser: (blockUserId: number) => void
} | null>(null);


export const ChatProvider = ({ children} : { children: ReactNode }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels ] = useState<IChannels>({MyDms: [], MyChannels: [], ChannelsToJoin: []});
  const [openedWindows, setOpenedWindows] = useState<IChatWindow[]>([])
  const [prevPseudo, setPrevPseudo] = useState<string>('');
  const [blockedUsers, setblockedUsers] = useState<number[]>([]);

  /*********** init chat Context ************/
  const socketRef = useRef<Socket | null>(null);
  const initChatCtx = () => {

    const token = Cookies.get('jwtToken');
    if (!token)
      return

    const newSocket = io('http://localhost:3333/chat', {
      auth: {
        token: token
      }
    });

    setPrevPseudo(user?.pseudo || '');

    newSocket.on('connect', () => {

      setSocket(newSocket);

      backRequest('chat/channels', 'GET').then((ret) => {
        console.log("chat/channels route is giving : ", ret, "\n");
        let allChannels : IChannels = ret.data.channels as IChannels
        let blockedId : number[] = ret.data.blockedUser as number[]
        allChannels = moveMemberToFirstInIChannels(allChannels, "MyDms", user?.fortytwo_id || 0)
        allChannels = moveMemberToFirstInIChannels(allChannels, "MyChannels", user?.fortytwo_id || 0)
        allChannels = moveMemberToFirstInIChannels(allChannels, "ChannelsToJoin", user?.fortytwo_id || 0)
        allChannels && setChannels(allChannels);
        blockedId && setblockedUsers(blockedId);
      })

      /* *********************************************************
          * Message Created:
      ***********************************************************/
      newSocket?.on('Message Created', (message: IChatHistory, channelId: number) => {
        console.log("Message Created recieved", message);
        setOpenedWindows((prevWindow: IChatWindow[]) => {
          return prevWindow.map((window) => {
            if (window.id === channelId) {
              return {
                ...window,
                history: [...window.history, message]
              }
            }
            return window
          });
        });
      });

      /* *********************************************************
          * Channel Created :
            - reformat members so current user is on top
            - add Channel to the right place in channels:IChannels
      ***********************************************************/
      newSocket?.on('Channel Created', (newChannel : IChannel) => {
        console.log("channel created signal recieved: \n\n\n", newChannel);
        handleEventChannelCreated(newChannel);
      });

      /* *********************************************************
          * friendship Created :
            - reformat members so current user is on top
            - add Channel to the right place in channels:IChannels
            - emit back so socket .join can be run
      ***********************************************************/
      newSocket?.on('friendship Created', (newChannel : IChannel) => {
        console.log("friendship Created recieved: \n\n\n", newChannel);
        handleEventChannelCreated(newChannel);
        newSocket?.emit("Join Channel", newChannel)
      });

      /* *********************************************************
          * Channel Joined :
            - if new channel joined, open channel window //todo not accurate anymore
      ***********************************************************/
      newSocket?.on('Channel Joined', (newChannel: IChannel) => {
        console.log("channel Joined signal received\n", newChannel);
        if (newChannel.type != "MyDms"){
          newChannel.type = "MyChannels"
          setChannels((prev: IChannels) => ({
            ...prev!,
            MyChannels: addChannel(prev.MyChannels, newChannel),
            ChannelsToJoin: removeChannel(prev.ChannelsToJoin, newChannel.id),
          }))
          handleOpenWindow(newChannel);
        }
      });

      /* *********************************************************
          * Invited:
            - current user recieved an invitation to a private channel
            - make channel visible in channelsToJoin
      ***********************************************************/
      newSocket?.on('invited', (channel: IChannel) => {
        console.log("invited signal received", channel.id);
        channel.type = "ChannelsToJoin";
        setChannels((prev: IChannels) => ({
          ...prev!,
          ChannelsToJoin: addChannel(prev.ChannelsToJoin, channel),
        }));
      });

      /* *********************************************************
          * Chan updated:
            - update channel Password and password status
      ***********************************************************/
      newSocket?.on('chan updated', (channelid: number, isPassword: boolean, Password: string) => {
          setChannels((prev: IChannels) => ({
              ...prev!,
              MyChannels: prev.MyChannels.map((channel: IChannel, index: number) => {
                  if (index === channelid) {
                      return {
                          ...channel,
                          isPassword: isPassword,
                          Password: (isPassword ? Password : ''),
                      };
                  }
                  return channel;
              }),
          }));
      });

      /* *********************************************************
          * Friend connected:
            - update member with updatedUser
      ***********************************************************/
      newSocket?.on('Friend connected', (updatedUser: IChatMember) => {
        console.log("Friend connected recieved", updatedUser)
        updateChatMember(updatedUser);
      });

      /* *********************************************************
          * Friend disconnected:
            - update member with updatedUser
      ***********************************************************/
      newSocket?.on('Friend disconnected', (updatedUser: IChatMember) => {
        console.log("Friend disconnected recieved", updatedUser)
        updateChatMember(updatedUser);
      });

      /* *********************************************************
          * UserGameState:
            - update member with updatedUser
      ***********************************************************/
      newSocket?.on('userGameState', (userId: number) => {
        // emit chat gateway iam in game and tell to my friend i am in game
        newSocket?.emit('ingame Update');
        console.log("user gamestate received");
      });

      newSocket?.on('ingame Update', (updatedUser: IChatMember) => {
        console.log("ingame Update", updatedUser)
        updateChatMember(updatedUser);
      });

      /* *********************************************************
          * pseudo Update:
            - update member with updatedUser
      ***********************************************************/
      newSocket?.on('pseudo Update', (updatedUser: IChatMember) => {
        console.log("pseudo update recieved", updatedUser)
        updateChatMember(updatedUser);
      });

      /* *********************************************************
          * new owner:
            - update channel with new owner
      ***********************************************************/
      newSocket?.on('new owner', (channel: IChannel) => {
        console.log("new owner event received", channel)
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
      });

      /* *********************************************************
          * NewUserJoin:
            - a new members has join  channel
            - update channel with new member
            - update opened window with new channel update
      ************************************************************/
      newSocket?.on('NewUserJoin', (channel: IChannel) => {
        console.log("new user join event received", channel)
        channel.type = "MyChannels";
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows((prevState) => (getUpdatedIChatWindows(prevState, channel)));
      });


      /* *********************************************************
          * user blocked:
            - a user has blocked
            - delete dm with user's block
      ************************************************************/
      newSocket?.on('user blocked', (blockedUserId: number) => {
        console.log("user blocked received", blockedUserId);
        setblockedUsers((prevState: number[]) => [...prevState, blockedUserId]);
        const updatedMyDms: IChannel[] = channels.MyDms.filter((channel) => channel.members[1].id != blockedUserId);
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyDms: updatedMyDms,
        }));
      });

      /* *********************************************************
          * user unblocked:
            - unblock user
      ************************************************************/
      newSocket?.on('unblock user', (toUnblockedUserId: number) => {
        console.log("user unblocked received", toUnblockedUserId);
        const updatedBlockedList = blockedUsers.filter((userId) => userId != toUnblockedUserId);
        setblockedUsers(updatedBlockedList);
      });

      /* *********************************************************
          * user leave :
            - a member different than current user leaved
      ***********************************************************/
      newSocket?.on('user leave', (channel: IChannel) => {
        console.log("user leave receveid: ", channel);
        channel.type = "MyChannels";
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows((prevState) => (getUpdatedIChatWindows(prevState, channel)));
      });

      /* *********************************************************
          * Quited :
            - current user left  channel
      ***********************************************************/
      newSocket?.on('quited', (channel: IChannel) => {
        console.log("Channel quited: receveid: ", channel);

        channel.type = "ChannelsToJoin";
        setChannels((prev: IChannels) => ({
          ...prev!,
          ChannelsToJoin: (channel.isPrivate ? prev.ChannelsToJoin : addChannel(prev.ChannelsToJoin, channel)),
          MyChannels: removeChannel(prev.MyChannels, channel.id),
        }));
      });

      /* *********************************************************
          * chan deleted :
            - a channel has been deleted
      ***********************************************************/
      newSocket?.on('chan deleted', (chatId: number) => {
        console.log("chan deleted signal recieved:", chatId);
        setChannels((prev: IChannels) => ({
          ...prev!,
          ChannelsToJoin: removeChannel(prev.ChannelsToJoin, chatId),
          MyChannels: removeChannel(prev.MyChannels, chatId),
        }));
        // closeWindow(chatId);
        //todo remove from opened windows too ? techniquement impossible
      });

      /* *********************************************************
          * password updated :
            - a channel has been deleted
      ***********************************************************/
      newSocket?.on('password updated', (channel: IChannel) => {
        console.log("password updated signal recieved:", channel);
        setChannels((prev: IChannels) => ({
          ...prev,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState =>
            getUpdatedIChatWindows(prevState, channel));
      });

      /* *********************************************************
          * banned :
            - current user has been banned from channel //? OK
      ***********************************************************/
      newSocket?.on('banned', (chatId : number) => {
        console.log("banned event received", chatId)
        setChannels((prev: IChannels) => ({
          ...prev!,
          ChannelsToJoin: removeChannel(prev.ChannelsToJoin, chatId),
          MyChannels: removeChannel(prev.MyChannels, chatId),
        }));
        closeWindow(chatId);
      });

      /* *********************************************************
          * ban :
            - a member has been banned from channel //? OK
      ***********************************************************/
      newSocket?.on('ban', (channel: IChannel) => {
        console.log("ban event received", channel)
        channel.type= "MyChannels"
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
      });
      /* *********************************************************
          * unbanned :
            - current user has been unbanned from channel
      ***********************************************************/
      //todo current user has channel in channels to joined
      newSocket?.on('unbanned', (channel: IChannel) => {
        console.log("unbanned event received", channel)
        channel.type = "ChannelsToJoin";
        setChannels((prev: IChannels) => ({
          ...prev!,
          ChannelsToJoin: addChannel(prev.ChannelsToJoin, channel),
        }));
      });

      /* *********************************************************
          * unban :
            -  a member has been unban from channel
      ***********************************************************/
        newSocket?.on('unban', (channel: IChannel) => {
          console.log("unban event received", channel)
          channel.type= "MyChannels"
          setChannels((prev: IChannels) => ({
            ...prev!,
            MyChannels: getUpdatedChannel(prev.MyChannels, channel),
          }));
          setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
        });

      /* *********************************************************
          * kicked :
            - current user has been kicked from channel
      ***********************************************************/
      newSocket?.on('kicked', (channel : IChannel) => {
        console.log("kicked event received", channel)
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: removeChannel(prev.MyChannels, channel.id),
          ChannelsToJoin: channel.isPrivate ? prev.ChannelsToJoin : addChannel(prev.ChannelsToJoin, channel),
        }));
        closeWindow(channel.id);
      });
      /* *********************************************************
          * kick :
            - a member has been kicked from channel
      ***********************************************************/
      newSocket?.on('kick', (channel: IChannel) => {
        console.log("kick event received", channel)
        channel.type= "MyChannels"
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
      });

      /* *********************************************************
          * mute :
            -  a user has been muted in channel:
      ***********************************************************/
      newSocket?.on('mute', (channel: IChannel) => {
        console.log("mute event received", channel)
        channel.type= "MyChannels"
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
      });

      /* *********************************************************
          * unmute :
            -  a user has been unmute in channel:
      ***********************************************************/
      newSocket?.on('unmute', (channel: IChannel) => {
        console.log("unmute event received", channel)
        channel.type= "MyChannels";
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
      });

      /* *********************************************************
          * set-admin :
            -  a user past admin in channel:
      ***********************************************************/
      newSocket?.on('set-admin', (channel: IChannel) => {
        console.log("set-admin event received", channel)
        channel.type= "MyChannels";
        setChannels((prev: IChannels) => ({
          ...prev!,
          MyChannels: getUpdatedChannel(prev.MyChannels, channel),
        }));
        setOpenedWindows(prevState => getUpdatedIChatWindows(prevState, channel));
      });

      socketRef.current = newSocket;
    })
    newSocket.on('disconnect', () => {
      console.log('Socket Disconnected from server');
      // TODO: ajouter logique de gestion déconnexion
       socketRef.current?.off('friendConnected');
       socketRef.current?.off('friendDisconnected');
       socketRef.current?.off('channelUpdate');
       socketRef.current?.disconnect();
       socketRef.current = null;
    });
  }

  /* *********************************************************
      * ChatContext init useEffect
          - init if user authenticated and socket !connected
          - disconnect if !authenticated and socket connected
  ***********************************************************/

  useEffect(() => {
    if (user?.isAuthenticated && !socket?.connected) {
      initChatCtx();
    }
    else if (!user?.isAuthenticated && socket?.connected) {
      console.log("deleting socket useState Socket : ",user, socket);
      socketRef.current?.disconnect();
      setSocket(null)
    }
  }, [user])

  /* *********************************************************
      * useEffect for pseudo update
          - on change of user state change pseudo
          - the horrible ifs conditions is due to the fact that for some reason
            on update of user via settings user goes from partially "undefined" user
            to fully "defined pseudo" state which triggers the useEffect
            otherwise it would have been simpler to listen to user.pseudo only
  ***********************************************************/
  useEffect (() => {
    if (!socket || prevPseudo == '' || !user || !user?.fortytwo_id || !user.pseudo)
      return;
    if ( user.fortytwo_id && user.pseudo && prevPseudo != user.pseudo) {
      console.log('sending psudo Update signal', user.fortytwo_id)
      socket?.emit("pseudo Update")
      setPrevPseudo(user.pseudo);
    }
    }, [user, prevPseudo])




 /* ********************************************************************************************
     * fonctions to export
  ********************************************************************************************* */

  /* *********************************************************
      * moveMemberToFirst && moveMemberToFirstInIChannels:
        - moves specific member to first position in the channel
          if (found && not already first)
  ***********************************************************/
  const moveMemberToFirst = (members: IChatMember[], targetMemberId: number): IChatMember[] => {
    const targetIndex = members.findIndex(member => member.id === targetMemberId)
    if (targetIndex > 0) {
      const [removedMember] = members.splice(targetIndex, 1);
      members.unshift(removedMember);
    }
    return members;
  }

  const moveMemberToFirstInIChannels = (channels: IChannels, channelType: ChannelType, targetMemberId: number) => {
    const updatedIChannel = channels[channelType].map(channel => ({
      ...channel,
      members: moveMemberToFirst(channel.members, targetMemberId),
    }));
    return { ... channels, [channelType] : updatedIChannel};
  }

  /* *********************************************************
      * findIdInList
        - usage : if(findIdInList(channels[newChannel.type], newChannel.id))
          --> check if channels[key] contains
  ***********************************************************/
  const findIdInList = <T extends { id: number }>(list?: T[], idToFind?: number): T | undefined => {
    const foundElem = list?.find(elem => elem.id === idToFind);
    return foundElem;
  };

    /* *********************************************************
      * isChannelKnown
        - usage : if (usChannelKnown(currentStatem, "MyDms", 42))
          --> check if MyDms has a channel of id 42
  ***********************************************************/
  const isChannelKnown = (currentState: IChannels, channelKey: string, idToFind?: number): boolean => {
    if (!idToFind || !currentState[channelKey]) {
      return false;
    }
    return currentState[channelKey].find((channel: IChannel) => channel.id === idToFind) !== undefined;
  };

  /* *********************************************************
      * ischatOpenned
        - usage : if (ischatOpenned(26))
          --> check if chat of id 26 is in openedWindows
  ***********************************************************/
  const ischatOpenned = (idTofind: number) => {
    return openedWindows?.find((openedWindow: IChatWindow) => openedWindow.id === idTofind)
  }

  /* *********************************************************
      * handleEventChannelCreated
        - usage : called after recieving event 'Channel Created && Friendship Created'
          --> reformat members so current user is on top
          --> add Channel to the right place in channels:IChannels
  ***********************************************************/

  const handleEventChannelCreated = (newChannel: IChannel) => {
    setChannels((prevChannels: IChannels) => {
      if (user) {
        newChannel.members = moveMemberToFirst(newChannel.members, user.fortytwo_id || 0);
      }
      return addChannelToChannelsByType(prevChannels, newChannel);
    });
  };

  const addChannelToChannelsByType = (prevChannels: IChannels, newChannel: IChannel): IChannels => {
    if (newChannel.type === "MyChannels" && !newChannel.members.find(member => member.id === user?.fortytwo_id)) {
      newChannel.type = "ChannelsToJoin";
    }
    if (!isChannelKnown(prevChannels, newChannel.type, newChannel.id)) {
      return {
        ...prevChannels,
        [newChannel.type]: prevChannels ? [...prevChannels[newChannel.type], newChannel] : [newChannel],
      };
    }
      return prevChannels;
    };

    /* *********************************************************
      * updateMemberById
        - usage : called after recieving event 'Friend connected/disconnected && pseudo Update'
        --> update user in Ichannels && openedWindow
    ***********************************************************/
  const updateChatMember = (updatedUser: IChatMember) => {
    setChannels((prev) => {
      return getUpdatedMembersIChannels(prev, updatedUser);
    });
    setOpenedWindows((prevWindow) => {
      return getUpdatedMembersIChatWindows(prevWindow, updatedUser)
    });
  }

  const getUpdatedMembersIChannels = (channels: IChannels, updatedUser: IChatMember) => {
    const updatedMyDms = channels.MyDms.map((channel) => getUpdatedMembersIChannel(channel, updatedUser))
    const updatedMyChannel = channels.MyChannels.map((channel) => getUpdatedMembersIChannel(channel, updatedUser))
    const updatedMyDmsList = channels.ChannelsToJoin.map((channel) => getUpdatedMembersIChannel(channel, updatedUser))
    return {
      MyDms: updatedMyDms,
      MyChannels: updatedMyChannel,
      ChannelsToJoin: updatedMyDmsList,
    }
  }

  const getUpdatedMembersIChannel: (channel: IChannel, updatedUser: IChatMember) => IChannel = (channel, updatedUser) => {
    if (!channel)
      return channel;

    const updatedMembers = channel.members.map((member) =>
      member.id === updatedUser.id ? { ...member, ...updatedUser } : member
    );
    const updatedAdmins = channel.admins ? channel.admins.map((admin) =>
      admin.id === updatedUser.id ? { ...admin, ...updatedUser } : admin
    )
    : [] ;

    const updatedOwner = channel.owner ?
      channel.owner.id === updatedUser.id ? { ...channel.owner, ...updatedUser } : channel.owner
      : channel.owner;

    return {
      ...channel,
      members: updatedMembers,
      admins: updatedAdmins,
      owner: updatedOwner,
    };
  };

  const getUpdatedChannel = (channelList: IChannel[], updatedChannel: IChannel) => {
    const key = channelList.findIndex(channelList => channelList.id === updatedChannel.id)

    if (key != -1) {
      const updatedList = [...channelList];
      updatedList[key] = {
        ... updatedChannel,
      }
      return updatedList;
    }
    return channelList;
  }

  const getUpdatedIChatWindows = (windows: IChatWindow[], updatedChannel: IChannel) => {
    const key = windows.findIndex(window => window.id === updatedChannel.id)

    if (key != -1) {
      const updatedWindow = [...windows]; // = [...windows] creates a copy / = windows created a reference
      updatedWindow[key] = {
        ... updatedChannel,
        history: windows[key].history,
      }
      return updatedWindow;
    }
    return windows;
  }

  const getUpdatedMembersIChatWindows = (windows: IChatWindow[], updatedUser: IChatMember) => {
    return windows.map((window) => getUpdatedMembersIChatWindow(window, updatedUser));
  }

  const getUpdatedMembersIChatWindow: (window: IChatWindow, updatedUser: IChatMember) => IChatWindow = (window, updatedUser) => {
    if (!window)
      return window;

    const updatedMembers = window.members.map((member) =>
      member.id === updatedUser.id ? { ...member, ...updatedUser } : member
    );
    const updatedAdmins = window.admins ? window.admins.map((admin) =>
      admin.id === updatedUser.id ? { ...admin, ...updatedUser } : admin
    )
    : [] ;

    const updatedOwner = window.owner ?
      window.owner.id === updatedUser.id ? { ...window.owner, ...updatedUser } : window.owner
      : window.owner;

    return {
      ...window,
      members: updatedMembers,
      admins: updatedAdmins,
      owner: updatedOwner,
    };
  };

  //todo : change function by const =>
  const removeChannel = (channelList: IChannel[], channelId: number): IChannel[] => {
    return channelList.filter((channel) => channel.id != channelId);
  }

  const addChannel= (channelList: IChannel[], newChannel: IChannel): IChannel[] => {

    const channelExists = channelList.find((channel) => channel.id === newChannel.id);
    if (!channelExists) {
      return [...channelList, newChannel];
    }
    return channelList;
  }

  /* *********************************************************
      * handleOpenWindow
        - usage : handleOpenWindow(ChannelToOpen)
          --> turn Ichannel into IchatWindow (Ichannel + message history )
  ***********************************************************/
  const handleOpenWindow = async (chatData : IChannel) =>{
    if (!ischatOpenned(chatData.id)){
      await (backRequest('chat/chatWindowHistory/' + chatData.id, 'GET')).then(ret => {
        const newWindow: IChatWindow = {
          ...chatData,
          history: ret?.data || []
        }
        setOpenedWindows((current: IChatWindow[]) => {return([...current || [], newWindow])})
      }
      )
    }
    else
      console.log("window is already openned")
  }

  /*************************************** print functions */
  useEffect (() => {console.log("new openned window set : ", openedWindows)}, [openedWindows])
  useEffect (() => {console.log("new newChannels set : ", channels)}, [channels])
  useEffect (() => {if (channels?.MyDms.length) console.log("new newChannels set in MyDms: ", channels?.MyDms)}, [channels?.MyDms])
/********************************************************** */


  /* ********************************************************************************************
     * fonctions to export
  ********************************************************************************************* */

  // const closeWindow = (id : number) => {
  //   console.log("closeWindow called \n", id);
  //   setOpenedWindows((prev: IChatWindow[]) => prev ? prev.filter((f) => f.id !== id) : []);
  // }

  const closeWindow = (id: number) => {
    setOpenedWindows((prev: IChatWindow[]) =>
      prev ? prev.filter((window) => window.id !== id) : []
    );
  };

  const openWindow = async (chatData? : IChannel, form?: IFormData, password?: string) => {
    const data = {
      id:          chatData?.id?      chatData.id      :  undefined,
      name:        form?.name?        form.name        :  chatData?.name,
      type:        form?.type?        form.type        :  chatData?.type,
      members:     form?.members?     form.members     :  chatData?.members,
      isPrivate:   form?.isPrivate?   form.isPrivate   :  false,
      isPassword:  form?.isPassword?  form.isPassword  :  false,
      password:    form?.password?    form.password    :  "",
    }
    //todo : is isChannelKnow really usefull here ?

    // if channels == channelsToJoin, emit join Channel
    // case channel is not known --> we are creating a new channel,
    // chan creation and join channel will be done elsewhere
    if ((data.type && !isChannelKnown(channels, data.type, data.id))
        || data.type == 'ChannelsToJoin') {
      console.log("Join Channel called from openWindow with data : ", data)
      socket?.emit('Join Channel', data);
    }
    // if is myDms or MyChannels : open directly
    else if (chatData) {
      console.log("inside openWindow before calling handleOpenWindow: ", chatData);
      handleOpenWindow(chatData);
    }
  }

  const sendMessage = (message: string, channelId: number) => {
    if (message)
      socket?.emit('sendMessage', {message: message, channelId: channelId})
  }


  //todo set priorities. Can do multiple event in the same time
  const sendAdminForm = (chatId: number, targetId: number,
                         mute: boolean, unMute: boolean,
                         ban: boolean, unBan: boolean,
                         kick: boolean, admin: boolean,
                         isPassword: boolean, password: string) => {
    // console.log("Send Admin Form called");
    // console.log('chatId:', chatId);
    // console.log('targetId:', targetId);
    // console.log('mute:', mute);
    // console.log('unMute:', unMute);
    console.log('ban:', ban);
    console.log('unBan:', unBan);
    console.log('targetId:', targetId);
    // console.log('kick:', kick);
    // console.log('admin:', admin);
    // console.log('isPassword:', isPassword);
    // console.log('password:', password);
    const channel = channels.MyChannels.find((channel: IChannel) => channel.id == chatId);
    if (targetId) {
      if (mute && !ban)
        socket?.emit('mute', {chatId: chatId, userId: targetId});
      else if (unMute)
        socket?.emit('unmute', {chatId: chatId, userId: targetId});
      if (ban) {
        console.log('ban event emited');
        socket?.emit('ban', {chatId: chatId, userId: targetId});
      }
      else if (unBan) {
        console.log('unBan event emited');
        socket?.emit('unban', {chatId: chatId, userId: targetId});
      }
      if (kick && !ban )
        socket?.emit('kick', {chatId: chatId, userId: targetId});
      if (admin)
        socket?.emit('set-admin', {chatId: chatId, userId: targetId});
    }
    if (user) {
      if (isPassword && password) {// TODO add change pwd
        socket?.emit('update', {
          channelid: chatId,
          userId: user!.fortytwo_id,
          isPassword: isPassword,
          Password: password
        });
        console.log("update event send");
      } else if (!isPassword && channel?.isPassword) {
        socket?.emit('update', {channelid: chatId, userId: user?.fortytwo_id, isPassword: isPassword});
        console.log("update event send");
      }
    }
  }

  const addFriendToChannel = (nameToAdd: string, chatId: number) => {
    //check if name is in channels.MyDms (is friend)
    const foundChannel = channels.MyDms.find((channel: IChannel) =>
      channel.members.some((member) => member.name === nameToAdd)
    );
    //get friend profile via pseudo
    const friend = foundChannel ? foundChannel.members.find((member: IChatMember) => member.name === nameToAdd) : undefined;
    console.log(friend);
    if (friend) {
      console.log('emit : invit chatid: ', chatId, "/", friend.id);
      socket?.emit('invit', {chatId: chatId, userId: friend.id});
    }
  }

  const blockUser = (blockUserId: number) => {
    if (blockedUsers.find(userId => userId == blockUserId))
      return;
    socket?.emit('block', {id: blockUserId});
  }


  const leaveChannel = (chatId: number) => {
    socket?.emit('quit', {chatId: chatId});

    console.log("EMIT QUIT channel: ", chatId ,"\n\n\n");
    closeWindow(chatId);
  }


  /*********** return ctx ************/
  return (
    <ChatContext.Provider value={{ socket, channels, openedWindows, openWindow, closeWindow, sendMessage, sendAdminForm, addFriendToChannel, leaveChannel, blockedUsers, blockUser }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a UserProvider');
  }
  return context;
};




      // /* *********************************************************
      //     * Friend disconnected:
      //       - update member with updatedUser
      // ***********************************************************/
      // newSocket?.on('Friend disconnected', (updatedUser: IChatMember) => {
      //   console.log("Friend disconnected recieved", updatedUser)
      //   updateChatMember(updatedUser);
      // });

  // updateChannel --> replaced by get getUpdatedChannel.
  // Reason : remode / add changes the key of a channel and therefore its visual position
  // function updateChannel(channelList: IChannel[], channelToAdd: IChannel): IChannel[] {
  //   const updatedChannel = removeChannel(channelList, channelToAdd.id);
  //   return addChannel(updatedChannel, channelToAdd);
  // }

  // const handleEventChannelCreated = (newChannel : IChannel) => {
  //   if (user)
  //     newChannel.members = moveMemberToFirst(newChannel.members, user.fortytwo_id || 0)

  //   addChannelToChannelsByType(channels, newChannel)
  // }

  // const addChannelToChannelsByType = (channels: IChannels, newChannel: IChannel) => {

  //   if (newChannel.type == "MyChannels" && !newChannel.members.find(member => member.id === user?.fortytwo_id))
  //     newChannel.type = "ChannelsToJoin";
  //   if(!isChannelKnown(newChannel.type, newChannel.id)) {
  //     setChannels((prev: IChannels) => ({
  //       ...prev!,
  //       [newChannel.type]: prev ? [...prev[newChannel.type], newChannel] : [newChannel],
  //     }))
  //   }
  // }


  // const isChannelKnown = (channelKey: string, idToFind?: number) => {
  //   if (!idToFind)
  //     return false;
  //   return channels[channelKey].find((channel: IChannel) => channel.id === idToFind);
  // };

      // * quit event does not seems to exist anymore
      // /* *********************************************************
      //     * quit:
      //       - A member has left channel
      // ***********************************************************/
      // newSocket?.on('quit', (channel: IChannel) => {
      //   console.log("quit signal received", channel)
      //   setChannels((prev: IChannels) => ({
      //     ...prev!,
      //     MyChannels: getUpdatedChannel(prev.MyChannels, channel),
      //   }));
      // });
