import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const handleClick = (): void => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1 className="text-7xl font-display text-black 404">404</h1>
      <p className="text-5xl font-display text-grey Not Found Game Over">GAME OVER</p>
      <br></br>
      <button
        className='text-3xl font-display text-orangeNG hover:text-4xl ease-i-out duration-300 NewGame mt-32'
        onClick={handleClick}>
        Go home
      </button>
    </div>
  );
};

export default NotFound;