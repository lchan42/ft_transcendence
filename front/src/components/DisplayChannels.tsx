import React, {useEffect, useState} from "react";
import {IChannel, useChat} from "../context/ChatContext";
import Check from "../images/check.svg";
import Cross from "../images/cross.svg";
import {backRequest} from "../api/queries";

const DisplayChannels: React.FC = () => {
    const {channels, openedWindows, openWindow, closeWindow, leaveChannel, sendMessage } = useChat();
    const [displayInputPassword, setDisplayInputPassword] = useState(false);
    const [displayBadPassword, setDisplayBadPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [selectedTarget, setSelectedTarget] = useState<IChannel | null>(null);
    const [selectedTargetToDestroy, setSelectedTargetToDestroy] = useState<IChannel | null>(null);             // Permet de detruire la fenetre selectionner

    const [leaveChanId, setLeaveChanID] = useState(-1);

    useEffect(() => {
        if (leaveChanId != -1) {
            leaveChannel(leaveChanId);
            setLeaveChanID(-1);
        }
    }, [leaveChanId]);

    const handlePassword = () => {
        if (password && selectedTarget) {
            backRequest('chat/channels/' + selectedTarget.id + '/checkPassword', 'POST', {password: password}).then(data => {
                if (data.passwordOk) {
                    openWindow(selectedTarget);
                    setDisplayInputPassword(false);
                    setDisplayBadPassword(false);
                    setSelectedTarget(null);
                } else {
                    setDisplayBadPassword(true);
                }
            })
        }
    }

    useEffect(() => {
        if (!selectedTarget || !openedWindows)
            return;
        if (selectedTarget.id && !openedWindows.find(content => content.id === selectedTarget.id)) {
            if (selectedTarget.isPassword)
                setDisplayInputPassword(true);
            else {
                openWindow(selectedTarget);
                setSelectedTarget(null);
            }
        }
    }, [selectedTarget]);

    useEffect(() => {
        if (selectedTargetToDestroy)
            closeWindow(selectedTargetToDestroy.id);
        setSelectedTargetToDestroy(null);
    }, [selectedTargetToDestroy]);


    return (
        <div>
            {channels.MyChannels && channels.MyChannels.map((channel: IChannel , index: number) => (
                <li key={index} className="flex flex-row justify-between items-center">
                    <button className={"overflow-auto btn btn-ghost font-display text-base-200"}
                            onClick={() => setSelectedTarget(channel)}>{channel.name}
                    </button>
                    {displayInputPassword && selectedTarget && selectedTarget.id == channel.id && (
                        <div className={"absolute text-black bg-orangeNG flex flex-row justify-between items-center px-2 my-1"}>
                            <input type="password"
                                   placeholder="Password"
                                   className={"input input-sm w-full max-w-xs " + (displayBadPassword? "border-rose-500" : "")}
                                   value={password}
                                   onChange={e => {
                                       setPassword(e.target.value);
                                   }}
                            />
                            <button onClick={handlePassword} className={"btn btn-sm w-10"}>
                                <img src={Check} alt={"Check"}/>
                            </button>
                        </div>
                    )}
                    <button className="btn btn-square btn-ghost btn-sm p-2" onClick={() => setLeaveChanID(channel.id)}>
                        <img src={Cross} alt={"LeaveChat"} className={""}/>
                    </button>
                </li>
            ))}
        </div>
    );
}

export default DisplayChannels;