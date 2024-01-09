import React, {useState} from "react";
import Addfriend from "../images/addFriend.svg"
import {IChatWindow, useChat} from "../context/ChatContext";

interface AddFriendProps {
    chat: IChatWindow;
    unblockDisplayFunc: (props: boolean) => void;
}

const AddFriend: React.FC<AddFriendProps> = ({chat, unblockDisplayFunc}) => {
    const { addFriendToChannel } = useChat();
    const [addFriendPseudo, setAddFriendPseudo] = useState('');
    const handleAddFriend = () => {
        if (addFriendPseudo)
            addFriendToChannel(addFriendPseudo, chat.id);
        unblockDisplayFunc(false);
    }

    return (
        <div className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-72 text-orangeNG font-display">
            <label htmlFor={"AddFriend"} className={"font-display text-orangeNG p-2"}>Friend pseudo: </label>
            <div className={"flex flex-row justify-between p-2"}>
                <input id={"AddFriend"}
                       className={"input input-bordered input-sm max-w-xs w-52"}
                       type={"text"}
                       value={addFriendPseudo}
                       required={true}
                       minLength={1}
                       onChange={(e) => (
                           setAddFriendPseudo((e.target.value)))}/>
                <button onClick={handleAddFriend} className="btn btn-square btn-sm btn-ghost ring ring-white ring-offset-base-100 content-center">
                    <img src={Addfriend} alt={"addFriend"}/>
                </button>
            </div>
        </div>
    )
}

export default AddFriend;