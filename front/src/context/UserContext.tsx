import React, { createContext, useState, useContext, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backRequest, backResInterface} from '../api/queries';
import Cookies from 'js-cookie';
import { ChatProvider } from './ChatContext';

const UserContext = createContext<{
  user: backResInterface | null;
  // setUser: React.Dispatch<React.SetStateAction<backResInterface | null>>;
  updateUser: (fistConnection: boolean, newData: any) => void;
  disconnectUser: () => void
  refreshUser: () => void;
} | null>(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState<backResInterface | null>(null);
  const queryClient = useQueryClient();

    /***************************** */
    /* useQuery is for GET request*/
    /***************************** */
  const isJwtToken = () => {
    const jwtToken = Cookies.get("jwtToken")
    return jwtToken ? true : false;
  }

  const { data: userData, status} = useQuery({
  queryKey: ["userData"],
  queryFn: () => backRequest('users/profil', 'GET'),
  enabled: isJwtToken(),
  });

  const handleQuerySuccess = (updatedData : backResInterface) => {
    if (updatedData.isOk) {
      // console.log(updatedData)
      setUser(updatedData);
    }
    else // means that user 's token is either expired or user is not considered as connected by server
      disconnectUser();
    console.log("🚀 ~ file: UserContext.tsx:41 ~ updatedData :", updatedData)
  }

  useEffect(() => {
    if (status === 'success'){
      handleQuerySuccess(userData);
    }
    // else if (status === 'error'){}
  }, [status, userData])

      /******************************** */
     /* useMutation is for post request*/
    /******************************** */
  const mutation = useMutation(
    {
      mutationFn: async ({ fistConnection, params }: { fistConnection: boolean, params?: any }) => {
      const ret =  fistConnection
      ? await backRequest("auth/settingslock", "POST", params)
      : await backRequest("users/update", 'POST', params);
      return ret;
    },
      onSuccess: (newData) => {
        if (newData.isOk) {
          queryClient.invalidateQueries(["userData"]);
          setUser(newData)
        }
      },
    }
  );

  const handleUpdateUser = (fistConnection: boolean, newData) => {
    mutation.mutate({ fistConnection, params: newData });
  };

  const disconnectUser = async () => {
    await backRequest('auth/logout', 'POST').then((ret) => {
      console.log("\n\n\n\nusercontext disconnectUser is returning : ", ret )
      Cookies.remove("jwtToken");
      setUser((prevUser) => (
        console.log("prevUser: ", prevUser), {
        ...prevUser,
        ret,
        isAuthenticated: false,
      }));
    })
  };

  // Ajouter la fonction de rafraîchissement
  const refreshUser = async () => {
    const refreshedUserData = await backRequest('users/profil', 'GET');
    handleQuerySuccess(refreshedUserData);
  };


  return (
    <UserContext.Provider value={{
    user,
    updateUser: handleUpdateUser,
    disconnectUser,
    refreshUser,
    }}>
      {children}
      {/* <ChatProvider>{children}</ChatProvider> */}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
