import {useEffect, useState} from "react";
import {IChannel, IChatMember, IChatWindow, IFormData, useChat} from "../context/ChatContext";
import {Socket} from "socket.io-client";
import {IChannels} from "../context/ChatContext";
import {useUser} from "../context/UserContext";

interface NewChannelProps {
    close: () => void;
}

const NewChannel: React.FC<NewChannelProps> = ({close}) => {
    const { openWindow } = useChat();
    const {user, setUser} = useUser();   
    if (!user)
        return;                                                                   // Recuperation de la session de l'utilisateur

    const [formData, setFormData] = useState<IFormData>({
        name: '',
        isPrivate: false,
        isPassword: false,
        password: '',
        members: [{name: user.pseudo!, id: user.fortytwo_id!, connected: true}],
        type: 'MyChannels'
    })

    const toggleCreateChannel = () => {
        openWindow(undefined, formData, undefined); // TODO tests
        close();
    }

    return (
            <div className="absolute modal-box left-1/3 top-1/4 p-8 ml-auto bg-[#E07A5F] text-white font-display">
                <h3 className="font-bold text-lg">Create your channel!</h3>
                <div className="modal-action w-full">
                    <form method="post" className={"flex flex-col"} onSubmit={toggleCreateChannel}>
                        <div className={"flex flex-row justify-between items-center my-5 mx-5"}>
                            <label>Name:</label>
                            <input className="input input-bordered input-sm max-w-xs w-60 text-black"
                                   type={"text"}
                                   placeholder={"Title"}
                                   value={formData.name}
                                   onChange={(e) =>
                                       setFormData(prevFormData => ({
                                           ...prevFormData,
                                           name: e.target.value,
                                           }))}
                                   required={true}
                                   minLength={1}
                            />
                        </div>
                        <br/>
                        <div className={"flex flex-row justify-between items-center my-5 mx-5"}>
                            <label>Private ?</label>
                            <input className="input input-bordered input-sm max-w-xs w-10 checkbox"
                                   type={"checkbox"}
                                   checked={formData.isPrivate}
                                   onChange={(e) =>
                                    setFormData(prevFormData => ({
                                           ...prevFormData,
                                           isPrivate: (e.target.checked),
                                       }))}
                            />
                        </div>
                        <br/>
                        <div className={"flex flex-row justify-between items-center my-5 mx-5"}>
                            <label>Password ?</label>
                            <input className="input input-bordered input-sm max-w-xs w-10 checkbox"
                                   type={"checkbox"}
                                   checked={formData.isPassword}
                                   onChange={(e) =>
                                       setFormData(prevFormData => ({
                                           ...prevFormData,
                                           isPassword: (e.target.checked),
                                       }))}
                            />
                        </div>
                        <br/>
                        <div className={"flex flex-row justify-between items-center my-5 mx-5"}>
                            <label>Password:</label>
                            <input className="input input-bordered input-sm max-w-xs w-60 text-black"
                                   type={"password"}
                                   placeholder={"abcde"}
                                   onChange={(e) =>
                                       setFormData(prevFormData => ({
                                           ...prevFormData,
                                           password: e.target.value,
                                       }))}
                                   minLength={1}
                                   disabled={!formData.isPassword}
                            />
                        </div>
                        <button className="btn text-orangeNG" type={"submit"}>Create</button>
                    </form>
                </div>
            </div>
    );
}

export default NewChannel;