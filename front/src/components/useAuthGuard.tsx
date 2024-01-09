// useAuthGuard.tsx
import React, { useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();

  if (!user?.isAuthenticated) {
    // console.log("redirect user.ProtectedRoute")
    console.log("rediret towards ------> login : user is not authenticated")
    return <Navigate to="/login" replace />;
  }
  else if ( user.isF2Active && !user.isF2authenticated) {
    console.log("rediret  ------> login : user is not 2FA authenticated")
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthRedirectRoutes = ({ children }) => {
  const { user } = useUser();

  if (user?.isAuthenticated && !user.isF2Active) {
    console.log("redirect login ------> home authenticated and no2fa")
    return <Navigate to="/" replace />;
  }
  else if (user?.isAuthenticated && user.isF2Active && !user.isF2authenticated) {
    console.log("redirect login ------> TwoFA")
    return <Navigate to="/TwoFA" replace />;
  }
  else if (user?.isAuthenticated && user.isF2Active && user.isF2authenticated) {
    console.log("redirect login ------> home")
    return <Navigate to="/" replace />;
  }
  return children;
};


const Redirec2FAtRoutes = ({ children }) => {
  const { user } = useUser();
  // if connected and no 2fa active go home
  if (user?.isAuthenticated && !user.isF2Active) {
    console.log("redirect 2FA ------> home")
    return <Navigate to="/" replace />;
  }
  // if not connected go login
  else if (!user?.isAuthenticated){
  console.log("redirect 2FA ------> login")
  return <Navigate to="/" replace />;
  }
  return children;
};

export { ProtectedRoute, AuthRedirectRoutes, Redirec2FAtRoutes };




// import React from 'react';
// import { Navigate } from 'react-router-dom';

// const ProtectedRoute = ({ children, user }) => {
//   if (!user?.isAuthenticated) {
//     console.log("redirect home ------> login");
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// const AuthRedirectRoutes = ({ children, user }) => {
//   if (user?.isAuthenticated) {
//     console.log("redirect login ------> home");
//     return <Navigate to="/" replace />;
//   }
//   return children;
// };

// export { ProtectedRoute, AuthRedirectRoutes };
