import React, { useEffect, useState } from 'react';
import {backRequest, User} from '../api/queries';
import CardLeader from './CardLeader';
import ProfileModal from './ProfileComp';

const LeaderComp: React.FC = () => {
  const [me, setMe] = useState('');
  useEffect(() => {
    backRequest('users/profil', 'GET').then(data => {
      setMe(data.pseudo);
    })
  }, []);
  const [users, setUsers] = useState<User[]>([]);
  useEffect((): void => {
    backRequest('users/all', 'GET').then(data => {
      setUsers(data.allUser);
    })
    users.sort((a, b) => b.win - a.win);
  }, []);

  const [selectedUser, setSelectedUser] = useState<User>(null);
  const [displayModal, setDisplayModal] = useState<boolean>(false);
  useEffect((): void => {
    //console.log("USER MODAL: " + users[selectedUserIndex].pseudo);
    setDisplayModal(true);
    //console.log("USER TO DISPLAY: " + userToDisplay);
  }, [selectedUser]);

  const toggleCloseCardLeader = () => {
    setSelectedUser(null);
    setDisplayModal(false);
  }
  console.log()

  return (
    <>
      <div className="card-side card-bordered border-4 border-white bg-[#fbfaf3] shadow-xl p-12">
        <span className="font-display text-orangeNG text-3xl">
          Leaderboard
        </span>
        <div className="pt-7 grid gap-y-5">
          {users && users.slice().sort((a, b) => b.win - a.win).map((user: User, index: number) => (
            <CardLeader
              key={index}
              name={user.pseudo}
              rank={index + 1}
              numberOfWin={user.win}
              onClickUser={() => setSelectedUser(user)}
            />
          ))}
        </div>
      </div>

      <dialog id="my_modal_3" className="modal">
        <div className="modal-box shrink w-64 card card-bordered border-white border-4">
          <form method="dialog">
            <button className="btn btn-sm btn-circle text-bleuPseudo btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div>
            <ProfileModal user={selectedUser} myPseudo={me}/>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default LeaderComp;
