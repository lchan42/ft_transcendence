import React from 'react';

const ButtonLogin: React.FC = () => {


  const handleClick = (): void => {
    // const url =
    //   'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-48a3f14fb4926e3761601d04424e0b31cfc2ce67332b6703fe1bfea83d3b22d7&redirect_uri=http://localhost:3333/auth/callback&response_type=code&scope=public&state=a_very_long_random_string_wichmust_be_unguessable';
    // window.location.href = url;
    const url = `${import.meta.env.VITE_REACT_APP_API_URL}/oauth/authorize?client_id=${import.meta.env.VITE_REACT_APP_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_REACT_APP_REDIRECT_URI}&response_type=code&scope=public&state=a_very_long_random_string_wichmust_be_unguessable`;

    window.location.href = url;
  };

  return (
    <button
      className="btn btn-ghost bg-white text-black hover:bg-gray-200"
      onClick={handleClick}
    >
      42 LOGIN
    </button>
  );
};

export default ButtonLogin;
