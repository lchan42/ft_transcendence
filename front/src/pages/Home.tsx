import React, { useEffect } from "react";
import Buildings from '../images/BUILDINGCLOUDS.png';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import FireGif from '../components/FireGif';
import Chat from '../components/Chat';
import { GameService } from '../api/game.service';

function Home() {
    const { user } = useUser();
    const navigate = useNavigate();

    const renderFireAndBuilding = (
        <div className="relative FireBuilding z-0">
            <img src={Buildings} alt="Building" className="" />
            <div className="Fire">
            <FireGif />
            </div>
        </div>
    );

    const newGame = () => {
        GameService.createOrJoinGame().then((game) => {
            navigate(`/game/${game.id}`);
        }).catch((err) => {
            console.log(err);
        });
    };

    return (
        <div className='flex relative flex-col-reverse md:flex-row lg:flex-row xl:flex-row 2xl:flex-row h-full'>
            <div className='flex flex-col flex-1 items-center justify-center py-2 px-5 bg-red z-0'>
                <div className='renderFireBuilding'>
                    {renderFireAndBuilding}
                </div>
            </div>
            <div className='flex flex-col flex-1 items-center justify-center py-2 px-5 bg-red'>
                <button
                    className='text-6xl font-display text-orangeNG hover:text-7xl ease-in-out duration-300 mb-10 NewGame'
                    onClick={newGame}>
                    NEW GAME
                </button>
            </div>
            <div>
                <Chat />
            </div>
        </div>
    );
}

export default Home;
