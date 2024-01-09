import React from 'react';
import ProfileModal from './ProfileComp';

interface CardLeaderProps {
  name: string;
  rank: number;
  numberOfWin: number;
  onClickUser: () => void;
}

const CardLeader: React.FC<CardLeaderProps> = ({name, rank, numberOfWin, onClickUser}) => {
    const DisplayProfile = () => {
        onClickUser();
        document.getElementById('my_modal_3').showModal();
    };
    return (
      <div className="card card-side card-bordered bg-navbar border-white border-4 shadow-xl flex flex-row h-[3.5rem] overflow-hidden">
        <div className="bg-orangeNG font-display text-white text-center basis-1/6 pt-3 skew-x-[40deg] scale-150 -translate-x-6">
          <div className="-skew-x-[40deg] translate-x-6 scale-75"> {rank}</div>
        </div>
        <div className="text-center basis-4/6 mt-3">
          <span className="font-display text-bleuPseudo cursor-pointer" onClick={DisplayProfile}>{name}</span>
        </div>
        <div className="bg-bleuPseudo font-display text-center text-white basis-1/5 pt-3 skew-x-[40deg] scale-150">
          <div className="-skew-x-[40deg] scale-75">{numberOfWin} wins</div>
        </div>
      </div>

  );
};

export default CardLeader;
