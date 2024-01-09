import React, {useState} from "react";
import {useUser} from "../context/UserContext";
import { IChatHistory } from "../context/ChatContext";
import { useNavigate } from 'react-router-dom';

interface MessageProps {
    message: IChatHistory;
    blockedUsers: number[] | null;
}

const Message: React.FC<MessageProps> = ({message, blockedUsers}) => {
    const {user} = useUser();
    const navigate = useNavigate();


    if (!user || (blockedUsers && blockedUsers.find(blockedUserId => blockedUserId == message.owner.id)))
        return;
    const classNameMessage = message.owner.id == user.fortytwo_id ? "chat chat-end" : "chat chat-start";
    const getOnlyPathFromURL = (url: string): string => {
        const urlObject = new URL(url);
        return urlObject.pathname;
    }
    const getMessageContentWithUrlOrNot = (content: string): JSX.Element => {
        const splitContent = content.split(' ');
        const regex = new RegExp(/(https?:\/\/[^\s]+)/g);
        const contentWithUrl = splitContent.map((word: string, index: number) => {
            if (word.match(regex)) {
                return (
                    <button onClick={() => {
                        navigate(getOnlyPathFromURL(word));
                    }} key={index} className="text-blue-500 hover:underline">
                        Join the game
                    </button>
                )
            }
            return word + ' ';
        })
        return (
            <div className="chat-bubble break-all">
                {contentWithUrl}
            </div>
        )
    }
    return (
        <div className={classNameMessage}>
            <div className="chat-header">
                {message.owner.name}
            </div>
            <div className="chat-bubble break-words">
                {getMessageContentWithUrlOrNot(message.content)}
            </div>
        </div>
    )
}

export default Message;
