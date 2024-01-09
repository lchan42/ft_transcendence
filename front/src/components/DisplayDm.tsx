import React, {useEffect, useState} from "react";
import {IChannel, useChat} from "../context/ChatContext";
import Play from "../images/play.svg";

interface DisplayDmProps {
    loadPrivateGame: (userId: number) => void;
    setPrivateGameModalOpened: (value: boolean) => void;
}
const DisplayDm: React.FC<DisplayDmProps> = ({loadPrivateGame, setPrivateGameModalOpened}) => {
    const {channels, openedWindows, openWindow, closeWindow, leaveChannel, sendMessage } = useChat();
    const [selectedTarget, setSelectedTarget] = useState<IChannel | null>(null);


    useEffect(() => {
        if (!selectedTarget || !openedWindows)
            return;
        if (selectedTarget.id && !openedWindows.find(content => content.id === selectedTarget.id)) {
            openWindow(selectedTarget);
            setSelectedTarget(null);
        }
    }, [selectedTarget]);




    return (
        <div>
            {channels.MyDms && channels.MyDms.map((dm: IChannel , index: number) => (
                <li key={index} className="flex flex-row justify-between items-center">
                    <button className={"overflow-auto btn btn-ghost font-display text-orangeNG"}
                            onClick={() => setSelectedTarget(dm)}>{dm.members[1].name}
                        <div className={"badge badge-xs " + (
                            dm.members[1].in_game ?
                                " badge-info " :
                                dm.members[1].connected ?
                                    " badge-success " :
                                    " badge-neutral ") }>
                        </div>
                    </button>
                    <button className="btn btn-square btn-ghost btn-sm"
                            onClick={() => {
                                loadPrivateGame(dm.id);
                                setPrivateGameModalOpened(true);
                            }}>
                        <img src={Play} alt={"play"} className={""}/>
                    </button>
                </li>
            ))}
        </div>
    );
}

export default DisplayDm;