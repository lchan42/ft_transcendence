import React, { useEffect } from 'react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { IChatWindow, IChannel, IChannels, IFormData, useChat } from '../context/ChatContext';
import CreateChannel from './CreateChannel';
import WindowChannel from './WindowChannel';
import WindowChat from './WindowChat';
import CreateGame from '../pages/game/CreateGame';
import Messagerie from '../images/chat.svg';
import Channel from '../images/channel.svg';
import NewChannel from '../images/newChan.svg';
import DisplayDm from './DisplayDm';
import DisplayChannels from './DisplayChannels';
import DisplayChannelsToJoin from './DisplayChannelsToJoin';
import { CustomModal } from './CustomModal';

const Chat: React.FC = () => {
    const { openedWindows, closeWindow } = useChat();
    const { user, setUser } = useUser();                                                                      // Recuperation de la session de l'utilisateur
    const [loadPrivateGame, setLoadPrivateGame] = useState(-1);
    const [selectedTargetToDestroy, setSelectedTargetToDestroy] = useState<IChannel | null>(null);             // Permet de detruire la fenetre selectionner

    const [createChannel, setCreateChannel] = useState(false);                                          // Appel module create channe
    const toggleCreateChannel = () => {                                                                             // Permet de gerer la creation d'un channel quand j'appuis sur le bouton create channel
        setCreateChannel(createChannel !== true);
    };

    /* Permet de configurer l'affichage, le contenue et le style du drawer */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const toggleDrawerOpen = () => {
        setDrawerOpen(drawerOpen !== true);
    };

    const [displayChannelDrawer, setDisplayChannelDrawer] = useState(false);
    /* Gere le basculement DM/Channel */
    const toggleDisplayChannel = () => {
        setDisplayChannelDrawer(displayChannelDrawer !== true);
    };

    useEffect(() => {
        if (selectedTargetToDestroy)
            closeWindow(selectedTargetToDestroy.id);
        setSelectedTargetToDestroy(null);
    }, [selectedTargetToDestroy]);

    const [modalIsOpen, setIsOpen] = React.useState(false);

    return (
        <div className={'drawer drawer-end flex flex-col-reverse h-full items-end static'}>
            {loadPrivateGame != -1 && (
                <>
                    <CustomModal
                        modalIsOpen={modalIsOpen}
                        openModal={() => setIsOpen(true)}
                        afterOpenModal={() => {
                        }}
                        closeModal={() => setIsOpen(false)}
                        modalContent={
                            <CreateGame channelId={loadPrivateGame} />
                        }
                        contentLabel={'Create Game'}
                    />
                </>
            )}
            <input id='my-drawer-4' type='checkbox' className='drawer-toggle' onClick={toggleDrawerOpen} />
            <div className={'drawer-content ' + (drawerOpen ? '' : 'z-10')}>
                <label htmlFor='my-drawer-4'
                       className='btn drawer-button btn-circle m-5 p-2'>
                    <img src={Messagerie} alt={'chat'} className={'w-10'} />
                </label>
            </div>
            <div className='drawer-side mt-16'>
                <label htmlFor='my-drawer-4' aria-label='close sidebar' className='drawer-overlay opacity-0'></label>
                <ul className={'menu p-4 w-60 min-h-full text-base-content relative ' + (displayChannelDrawer ? 'bg-orangeNG' : 'bg-base-200')}>
                    {!displayChannelDrawer && (
                        <DisplayDm loadPrivateGame={setLoadPrivateGame} setPrivateGameModalOpened={setIsOpen} />
                    )}
                    {displayChannelDrawer && (
                        <li className='flex flex-row justify-between items-center border-b-2 font-display px-9 text-base-200 mb-5'>MY
                            CHANNEL</li>
                    )}
                    {displayChannelDrawer && (
                        <DisplayChannels />
                    )}
                    {displayChannelDrawer && (
                        <li className='flex flex-row justify-between items-center border-b-2 font-display px-16 text-base-200 mb-5'>PUBLIC</li>
                    )}
                    {displayChannelDrawer && (
                        <DisplayChannelsToJoin />
                    )}
                    {displayChannelDrawer && (
                        <div className='self-center mt-auto mb-48 border border-2 rounded-lg'>
                            <button className='btn btn-square btn-ghost p-2' onClick={toggleCreateChannel}>
                                <img src={NewChannel} alt={'newChan'} className={'w-10'} />
                            </button>
                        </div>
                    )}
                    <div
                        className='self-center flex flex-row items-center justify-around mb-36 absolute bottom-0 border border-2 rounded-lg p-2'>
                        <img src={Messagerie} alt={'chat'} className='mx-5 w-10' />
                        <input type='checkbox'
                               className='toggle toggle-md'
                               defaultChecked={false}
                               onChange={toggleDisplayChannel} />
                        <img src={Channel} alt={'channel'} className='mx-5 w-10' />
                    </div>
                </ul>
                <div className='absolute mr-64 mb-32 bottom-0 flex flex-row-reverse overflow-hidden'>
                    {drawerOpen && openedWindows && openedWindows.map((channel: IChatWindow, index: number) =>
                            channel.type == 'MyDms' && (
                                <div key={index} className='px-5'>
                                    <WindowChat user={channel.members[1].name}
                                                me={user}
                                                destroyChat={() => setSelectedTargetToDestroy(channel)}
                                                history={channel.history}
                                                chatId={channel.id}
                                    />
                                </div>
                            ),
                    )}
                    {drawerOpen && openedWindows && openedWindows.map((channel: IChatWindow, index: number) =>
                        channel.type == 'MyChannels' && (
                            <div key={index} className='px-5'>
                                <WindowChannel chat={channel}
                                               destroyChannel={() => setSelectedTargetToDestroy(channel)}
                                />
                            </div>
                        ))
                    }
                </div>
                {createChannel && (
                    <CreateChannel close={toggleCreateChannel} />
                )}
            </div>
        </div>
    );
};

export default Chat;
