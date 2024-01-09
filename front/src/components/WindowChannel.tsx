import React, { useEffect, useState } from "react";
import Message from "./Message";
import Send from "../images/send.svg"
import Cross from "../images/cross.svg"
import Setting from "../images/setting.svg"
import Addfriend from "../images/addFriend.svg"
import {IChatWindow, IChatHistory, IChatMember, useChat} from "../context/ChatContext";
import {useUser} from "../context/UserContext";
import AddFriend from "./AddFriend";
import ChatMemberList from "./ChatMemberList";
import SettingsChat from "./SettingsChat";

interface WindowChannelProps {
    chat: IChatWindow;
    destroyChannel: () => void;
}

const WindowChannel: React.FC<WindowChannelProps> = ({chat, destroyChannel}) => {
    const {user, setUser} = useUser();                                                                      // Recuperation de la session de l'utilisateur
    const { sendMessage, blockedUsers } = useChat();
    const [displayChat, setDisplayChat] = useState(chat.isPassword !== true);
    const [message, setMessage] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [displayParam, setDisplayParam] = useState(false);
    const [displayMemberList, setDisplayMemberList] = useState(false);
    const [displayAddFriend, setDisplayAddFriend] = useState(false);
    const [displaySettings, setDisplaySettings] = useState(false);

    const toggleDisplayChat = () => {
        setDisplayChat(displayChat !== true);
    }

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
    };

    const trueDisplayAddFriend = () => {setDisplayAddFriend(true)};
    const toggleAddFriend = () => {setDisplayAddFriend(displayAddFriend !== true)};
    const toggleDisplaySettings = () => {setDisplaySettings(displaySettings !== true)}

    const openParam = () => {
        setDisplayParam(true);
        setDisplayMemberList(false);
        setDisplaySettings(false);
    };
    const openMemberList = () => {
        setDisplayMemberList(true);
        setDisplayParam(false);
        setDisplaySettings(false);
    };


    const closeParam = () => {setDisplayParam(false);};
    const closeMemberList = () => {setDisplayMemberList(false);};

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            handleSendMessage();
        }
    };

    const handleSendMessage = () => {
        if ((chat.mute && !chat.mute.find((userMuted) => userMuted.id === user?.fortytwo_id)) ||
            !chat.mute) {
            sendMessage(message, chat.id);
            setMessage('');
        }
    }


    useEffect(() => {
        scrollToBottom();
    }, [chat?.history]);

    const scrollToBottom = () => {
        const messageContainer = document.getElementById('message-container'); // TODO fix comme chez windowchat
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    };


    return (
        <div className={`collapse bg-orangeNG px-5 w-96 window-chat ${isChecked ? 'checked' : ''}`}>
            <input type="checkbox" className="h-4" checked={isChecked} onChange={handleCheckboxChange}/>
            <div className="collapse-title text-white font-display">
                {chat.name}
            </div>
            <div>
                <div className="absolute top-0 right-0">
                    <div className="absolute top-0 right-0 flex flex-row-reverse z-10">
                        <button className="btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center"
                                onClick={destroyChannel}>
                            <img src={Cross} alt={"cross"} className={"p-2"}/>
                        </button>
                        <div className="dropdown dropdown-end">
                            <button className={"btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center mx-1"}
                                    onClick={toggleDisplaySettings}>
                                <img src={Setting} alt={"setting"} className={"p-1"}/>
                            </button>
                            {displaySettings && (
                                <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 text-orangeNG font-display">
                                    <li><button onClick={openMemberList}>Members</button></li>
                                    {(chat.owner.id == user?.fortytwo_id ||
                                        chat.admins.find((admin: IChatMember) => admin.id == user?.fortytwo_id)) && (
                                        <li><button onClick={openParam}>Settings</button></li>
                                    )}
                                </ul>
                            )}
                        </div>
                        {chat.isPrivate && (
                            <div className="dropdown dropdown-end">
                                <button onClick={toggleAddFriend} className="btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center">
                                    <img src={Addfriend} alt={"addFriend"} className={"p-1"}/>
                                </button>
                                {displayAddFriend && (
                                    <AddFriend chat={chat} unblockDisplayFunc={trueDisplayAddFriend}/>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {displayMemberList && (
                    <ChatMemberList chat={chat} closeList={closeMemberList} />
                )}
                {displayParam && (
                    <SettingsChat chat={chat} closeSettings={closeParam} />
                )}
                <div id={"message-container"} className="border hover:border-slate-400 rounded-lg h-80 flex flex-col overflow-auto">
                    {chat?.history && chat.history.map((msg: IChatHistory, index: number) => ( //TODO changer message par la bonne strategie
                        <Message message={msg} key={index} blockedUsers={blockedUsers}/>
                        ))}
                </div>
                <div className="flex flex-row justify-between py-4" onKeyDown={handleKeyDown}>
                    <input className="input input-bordered input-sm max-w-xs w-60"
                           placeholder="Tapez votre message..."
                           type="text"
                           value={message}
                           onChange={(e) => setMessage(e.target.value)} />
                    <button className="btn btn-circle btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center"
                            onClick={handleSendMessage}>
                        <img src={Send} alt="Send" />
                    </button>
                </div>
            </div>
        </div>
    )
}
export default WindowChannel;