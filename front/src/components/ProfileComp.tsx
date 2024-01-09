import React, {useEffect, useState} from 'react';
import MGameWatch from '../images/MGameWatch.png';
import {backRequest, backResInterface} from "../api/queries";
import {useUser} from "../context/UserContext";
import {bool} from "yup";

interface ProfilCompProps {
  user: backResInterface;
  myPseudo: string;
}

const ProfileComp: React.FC<ProfilCompProps> = ({user, myPseudo}) => {
    const [friendAdded, setFriendAdded] = useState<boolean>(false);
    const [userIsBlocked, setUserIsBlocked] = useState<boolean>(false);

    useEffect(() => {
        if (!user)
          return;
        if (myPseudo == user.pseudo) {
            setFriendAdded(true);
            return;
        } else {
            backRequest('users/isBlock/' + user?.fortytwo_id, 'GET').then(data => {
                setUserIsBlocked(data.isBlock!);
            })
            backRequest('users/isFriend/' + user?.pseudo, 'GET').then(data => {
                setFriendAdded(data.isFriend!);
            })
        }
    }, [user]);

    const toggleUser = () => {
        if (userIsBlocked) {
            backRequest('chat/unblockUser/' + user.fortytwo_id, 'POST');
            setUserIsBlocked(false);
        } else if (friendAdded)
            return;
        else {
            backRequest('chat/addFriend', 'POST', {pseudo: user.pseudo}).then(data => {
                if (data.isOk)
                    setFriendAdded(true);
            });
        }
    }

  return (
    <div className="flex flex-col grid gap-6 justify-items-center">
      <div className="w-36 rounded-full avatar online ring ring-white ring-8 drop-shadow-md shrink">
        <img src={user?.avatar} alt="avatar" className="rounded-full" />
      </div>
      <div className="text-center">
        <span className="font-display text-2xl text-bleuPseudo pseudoProfil">
        {user?.pseudo}
        </span>
        <br></br>
        <span className="font-display text-sm text-vertOnLine">
          On line
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg
          width="50px"
          height="50px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path
            d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z"
            stroke="#3E415C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z"
            stroke="#3E415C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z"
            stroke="#3E415C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z"
            stroke="#3E415C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-display text-3xl text-orangeNG self-end">{user?.xp}</span>
      </div>
      <button className={"btn btn-active btn-sm font-display btn-secondary text-xs text-white " + (userIsBlocked ? "btn-error" : friendAdded ? "btn-disabled" : "")}
              onClick={toggleUser}>{userIsBlocked? "unblock user": friendAdded ? "Friend" : "Add to friend"}</button>
    </div>
  );
};

export default ProfileComp;
