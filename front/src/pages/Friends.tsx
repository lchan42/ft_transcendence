import React from "react";
import ProfileComp from '../components/ProfileComp';

function Friends() {
  return (
    <>
      <div className="flex">
        <div className="basis-1/6 self-center">
          <ProfileComp />
        </div>
        <div className="barre-verticale"></div>
        <div className="p-12">
          <FriendComp />
        </div>
      </div>
    </>
  );
}

export default Friends;
