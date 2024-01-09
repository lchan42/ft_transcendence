import React, {  useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from '../../api/game.service';
import {useUser} from "../../context/UserContext";
import {useChat} from "../../context/ChatContext";

// to do
// test api =>
// given : user create a private game
// when : user join the game
// then : user is redirected to the game page
// route doesn't exist in api => remy must create it

function CreateGame({channelId}) {
  const { sendMessage } = useChat();                                                                     // Recuperation de la session de l'utilisateur
  const [ballSpeedY, setBallSpeedY] = useState<number>(2);
  const [ballSpeedX, setBallSpeedX] = useState<number>(2);
  const [ballSize, setBallSize] = useState<number>(2);
  const [victoryPoints, setVictoryPoints] = useState<number>(5);
  const [paddleHeight, setPaddleHeight] = useState<number>(2);
  const [paddleWidth, setPaddleWidth] = useState<number>(2);
  const navigate = useNavigate();
  const handleSpeedYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBallSpeedY(Number(e.target.value));
  };

  const handleSpeedXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBallSpeedX(Number(e.target.value));
  }

  const handleBallSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBallSize(Number(e.target.value));
  }

  const handlePaddleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaddleHeight(Number(e.target.value));
  }

  const handlePaddleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaddleWidth(Number(e.target.value));
  }

  const handleVictoryPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVictoryPoints(Number(e.target.value));
  }

  const newPrivateGame = () => {
    GameService.createPrivateGame(ballSpeedY, ballSpeedX, ballSize, victoryPoints, paddleHeight, paddleWidth).then((game) => {
      if (channelId) {
        const url = window.location.href + "game/" + game.id;
        const message = `I just created a game, join me ! ${url}`;
        sendMessage(message, channelId);
      }
      navigate(`/game/${game.id}`);
    }).catch((err) => {
      console.log(err);
    })
  };

  return (
    <>
      <div className="card-side card-bordered border-4 border-white bg-[#fbfaf3] shadow-xl p-12 flex flex-col items-center max-w-lg mx-auto mt-4">
    <span className="font-display text-orangeNG text-3xl mb-4">
        Creating game
      </span>
        <div className='max-w-sm mx-auto p-4'>
          <div className='mb-4'>
            <label htmlFor='ballSpeedY' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                      Ball speed y: {ballSpeedY}
                  </span>
            </label>
            <input
              type='range'
              id='Ball speed y'
              min='1'
              max='3'
              value={ballSpeedY}
              onChange={handleSpeedYChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='ballSpeedX' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                      Ball speed x: {ballSpeedX}
                  </span>
            </label>
            <input
              type='range'
              id='ball speed x'
              min='1'
              max='3'
              value={ballSpeedX}
              onChange={handleSpeedXChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='ballSize' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                      Ball size: {ballSize}
                  </span>
            </label>
            <input
              type='range'
              id='ballSize'
              min='1'
              max='3'
              value={ballSize}
              onChange={handleBallSizeChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='paddleHeight' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                        Paddle height: {paddleHeight}
                  </span>
            </label>
            <input
              type='range'
              id='Paddle height'
              min='1'
              max='3'
              value={paddleHeight}
              onChange={handlePaddleHeightChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='paddleWidth' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                        Paddle width: {paddleWidth}
                  </span>
            </label>
            <input
              type='range'
              id='Paddle width'
              min='1'
              max='3'
              value={paddleWidth}
              onChange={handlePaddleWidthChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='victoryPoints' className='block text-gray-700 text-sm font-bold mb-2'>
                  <span className='label-text text-base'>
                      Victory points: {victoryPoints}
                  </span>
            </label>
            <input
              type='range'
              id='rounds'
              min='1'
              max='10'
              value={victoryPoints}
              onChange={handleVictoryPointsChange}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
            />
          </div>
          <div>
            <button
              className="btn btn-secondary btn-block font-display mt-6 text-white"
              onClick={newPrivateGame}>
              Create game
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default CreateGame;