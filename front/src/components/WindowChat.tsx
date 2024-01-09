// @ts-ignore
import React, { useEffect, useState } from "react";
import { backRequest, backResInterface } from "../api/queries";
import ProfileComp from "./ProfileComp";
import Message from "./Message";
import Send from "../images/send.svg"
import Profil from "../images/profil.svg"
import Cross from "../images/cross.svg"
import {IChatHistory, useChat} from "../context/ChatContext";

interface WindowChatProps {
    user: string;
    me: string;
    destroyChat: () => void;
    history: IChatHistory[];
    chatId: number;
}

const WindowChat: React.FC<WindowChatProps> = ({user, me, destroyChat, history, chatId}) => {
    if (!user)
        return null;

    const { sendMessage } = useChat();
    const [message, setMessage] = useState('');

    const [isChecked, setIsChecked] = useState(false);

    const [displayUserProfil, setDisplayUserProfil] = useState(false);
    const [userProfil, setUserProfil] = useState<backResInterface | null>(null);
    useEffect(() => {
        backRequest('users/user', 'PUT', {pseudo: user}).then(data => {
            setUserProfil(data);
        })
    }, []);

    const toggleDisplayUserProfil = () => {
        setDisplayUserProfil(displayUserProfil !== true);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            handleSendMessage();
        }
    };

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
    };

    const handleSendMessage = () => {
        sendMessage(message, chatId);
        setMessage('');
    }

    const scrollToBottom = () => {
        const messageContainer = document.getElementById('message-container' + user);
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);


    return (
        <div className={`collapse bg-base-200 px-5 w-80 window-chat ${isChecked ? 'checked' : ''}`}>
            <input type="checkbox" className="h-4" checked={isChecked} onChange={handleCheckboxChange}/>
            <div className="collapse-title text-orangeNG font-display">
                {user}
            </div>
            <div className="absolute top-0 right-0 flex flex-row-reverse z-10">
                <button className="btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center"
                        onClick={destroyChat}>
                    <img src={Cross} alt={"cross"} className={"p-2"}/>
                </button>
                <button className="btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center mx-1"
                        onClick={toggleDisplayUserProfil}>
                    <img src={Profil} alt={"profil"} className={""}/>
                </button>
            </div>
            <div className={""}>
                {displayUserProfil && (
                    <ProfileComp user={userProfil!}/>
                )}
                {!displayUserProfil && (
                    <div id={"message-container" + user} className="border hover:border-slate-400 rounded-lg h-80 flex flex-col overflow-auto">
                        {history && history.map((msg, index) => (
                            <div key={index}>
                                <Message message={msg} blockedUsers={null} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-row justify-between py-4" onKeyDown={handleKeyDown}>
                <input
                    className="input input-bordered input-sm max-w-xs w-60"
                    placeholder="Tapez votre message..."
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button className="btn btn-circle btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center"
                    onClick={handleSendMessage}>
                    <img src={Send} alt="Send" />
                </button>
            </div>
        </div>
    )
}
export default WindowChat;
