import { IChannel, IChannels } from "../context/ChatContext";

export const createUser = async (params: any) => {
  try {
    const response = await fetch(
      'http://localhost:3333/auth/update',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );
    return response.status === 200
      ? await response.json()
      : {};
  } catch (error) {
    console.log(error);
  }
};

export interface User {
  fortytwo_userName: string;
  pseudo: string;
  avatar: any;
  isF2Active: boolean;
  userChannels: {channelId: number }[];
  friends: string[];
  win?: number
}

export async function getUser() {
  try {
    const response = await fetch(
      'http://localhost:3333/users/profil', {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Échec de la requête');
    }
    const data: User = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      "Une erreur s'est produite lors de la récupération des données : " +
        error.message
    );
  }
}

export async function getUsers() {
  try {
    const response = await fetch(
        'http://localhost:3333/users/all', {
          credentials: 'include',
          method: 'GET',
        }
    );
    if (!response.ok) {
      throw new Error('Échec de la requête');
    }
    const data: User[] = await response.json();
    return data;
  } catch (error) {
    throw new Error(
        "Une erreur s'est produite lors de la récupération des données : " +
        error.message
    );
  }
}


export async function getMessage() {
  try {
    const response = await fetch(
        'http://localhost:3333/channels/:id/msg', {
          credentials: 'include',
          method: 'GET',
        }
    );
    if (!response.ok) {
      throw new Error('Échec de la requête');
    }
    return await response.json();
  } catch (error) {
    throw new Error(
        "Une erreur s'est produite lors de la récupération des données : " +
        error.message
    );
  }
}

/* ****************************************************************************
  * backRequest
    * exemple d'utilisation :
      try {
        const response: backResInterface = await backRequest('endpoint', 'GET', params);
        console.log(response.pseudo)
        }
      } catch (error){...}

    * params :
      - ce sont les elements a transmettre au back en fonction du endpoint emprunte. Type : frontReqInterface.

    * Return :
      - la reponse du back devrait etre un backResInterface comme dans l'exemple
      - mais il est egalement possible de faire : const result: { pseudo: string, autre: string } = await backRequest(..., ..., ...);
      - en fonction du endpoint emprunte, les champs peuvent etre undefined

    * erreur :
      - si error, check terminal
**************************************************************************** */

export interface frontReqInterface {
  pseudo?: string;
  avatar?: any;
  isF2Active?: boolean;
  token?: string;
  win?: number;
  codeQRAuth?: string;
  password?: string;
}

  export interface backResInterface {
    pseudo?: string;
    isOk?: boolean;
    message?: string;
    avatar?: any;
    isF2Active?: boolean;
	  isF2authenticated?: boolean;
	  connected?:boolean;
    fortytwo_id?: number;
    isBlock?: boolean;
    blockedUsers?: number[];
    isFriend?: boolean;
    friends?: number[];
    allUser?: User[];
    isAuthenticated?: boolean;
    channels?: IChannels;
    xp?: number;
    win?: number;
    chatFriends?: IChannel[]
    data?: any;
    qrCodeUrl?: string;
    verifyQrCode?: boolean;
    passwordOk?: boolean;
  }



export async function backRequest(url: string, method: string, params?: frontReqInterface | FormData): Promise<backResInterface> {
  try {
    const reqOptions: RequestInit = {
      method,
      credentials: 'include',
      body: params instanceof FormData ? params : JSON.stringify(params)
    };

    if (!(params instanceof FormData)) {
      reqOptions.headers = {
        'Content-Type': 'application/json',
      };
    }
    const response = await fetch('http://localhost:3333/' + url, reqOptions);
    // const data = await response.json(); // Correction ici

    console.log("back request ", url);

    return response.ok ? await response.json() : { isOk: false, message: response.status }
  }
  catch (error) {
    console.log("backRequest error : ", error);
    return { isOk: false, message: error }
  }
}

