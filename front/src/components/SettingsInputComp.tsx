/// <reference types="react" />
import React, { TimeHTMLAttributes } from 'react';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { UseFormRegister } from 'react-hook-form';
import { backRequest } from '../api/queries';

interface SettingsInputProps {
  settingsLock: boolean;
  register: UseFormRegister<{
    pseudo?: string | undefined;
    avatar?: any | undefined;
    isF2Active: NonNullable<boolean | undefined>;
  }>;
  errors: any;
}

interface inputValidity {
	isValid: boolean | undefined
	message: string | undefined;
}

const SettingsInput: React.FC<SettingsInputProps> = (props) => {
  const { user } = useUser();
  const [userInput, setUserInput] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [inputValidity, setInputValidity] = useState<inputValidity | undefined>(undefined);

  const handleInput = (input : string) => {
	if (timeoutId)
		clearTimeout(timeoutId);
	const newTimeoutId = setTimeout(async () => {
		setUserInput(input)
	}, 1000);
	setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
  if (userInput && userInput != user?.pseudo) {
	  backRequest("users/checkpseudo", "PUT", { pseudo: userInput }).then(ret => setInputValidity(
	  {isValid: ret.isOk, message: ret.message}));
  }
  }, [userInput]);

  return (
    <>
      <input
        type="text"
        placeholder={props.settingsLock ? "Nom d'utilisateur" : user?.pseudo}
        className="input input-bordered w-full mt-6"
        {...props.register('pseudo')}
        onInput={e => handleInput(e.currentTarget.value)}
        minLength={3} maxLength={15}
        pattern={"[A-Za-z]+"}
      />
      {userInput !== undefined && inputValidity !== undefined && userInput !== '' && (
        <span
          style={{
            color: inputValidity.isValid ? 'green' : 'red',
            fontSize: '13px',
          }}
        >
    { userInput + (inputValidity.isValid ? ' is valid !' : ' is not valide, ' + inputValidity.message)}
        </span>
      )}
      {props.errors.pseudo && (
        <span
          style={{
            color: '#db7706',
            fontSize: '13px',
          }}
        >
          {props.errors.pseudo.message}
        </span>
      )}
    </>
  );
};

export default SettingsInput;
