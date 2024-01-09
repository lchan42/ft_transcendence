import React, {useEffect, useState} from "react";
import {IChannel, useChat} from "../context/ChatContext";
import {useUser} from "../context/UserContext";
import {backRequest} from "../api/queries";

interface ChatMemberListProps {
    chat: IChannel;
    closeList: () => void;
}

const ChatMemberList: React.FC<ChatMemberListProps> = ({chat, closeList}) => {
    const { blockUser, blockedUsers } = useChat();
    const { user} = useUser();
    const [blockUserId, setBlockUserId] = useState(-1);
    const [unblockUserId, setUnblockUserId] = useState(-1);

    useEffect(() => {
        if (blockUserId != -1) {
            blockUser(blockUserId);
            setBlockUserId(-1);
        }
    }, [blockUserId]);

    useEffect(() => {
        if (unblockUserId != -1) {
            backRequest('chat/unblockUser/' + unblockUserId, 'POST');
            setUnblockUserId(-1);
        }
    }, [unblockUserId]);

    return (
        <div className={"absolute z-10 left-0 top-0 card h-full w-full bg-orangeNG shadow-xl"}>
            <div className="card-body flex flex-col overflow-auto">
                <h3 className={"font-display text-base-200"}>Member List:</h3>
                <ul className="bg-orangeNG rounded-box mt-5">
                    {chat.members.map((member, index) => (
                        <li key={index}
                            className={"flex flex-row border-b-4 font-display justify-between items-center p-2"}>
                            <div className={"text-base-200"}>
                                {member.name}
                            </div>
                            {blockedUsers.find((blockedUserId) => blockedUserId == member.id) && (
                                <button className={"btn btn-error text-base-200 btn-xs " + (
                                    member.id == user?.fortytwo_id ? "btn-disabled" : "")}
                                        onClick={() => setUnblockUserId(member.id)}>
                                    UNBLOCK
                                </button>
                            )}
                            {!blockedUsers.find((blockedUserId) => blockedUserId == member.id) && (
                                <button className={"btn btn-error text-base-200 btn-xs " + (
                                    member.id == user?.fortytwo_id ? "btn-disabled" : "")}
                                        onClick={() => setBlockUserId(member.id)}>
                                    BLOCK
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="card-actions absolute bottom-5 right-5 my-2 font-display">
                <button className="btn btn-primary btn-sm bg-base-200" onClick={closeList}>Close Member</button>
            </div>
        </div>
    );
}

export default ChatMemberList;