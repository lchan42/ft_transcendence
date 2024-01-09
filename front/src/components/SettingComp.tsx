import React from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import MGameWatch from '../images/MGameWatch.png';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { backRequest } from '../api/queries';
import { useUser } from '../context/UserContext';
import Gallery from './Gallery';
import SettingsInput from './SettingsInputComp'
import GameHistory from "./GameHistory";

const MAX_FILE_SIZE: number = 4 * 1024 * 1024; // 4 Mo
let fileSize: number = 0;

const SettingComp: React.FC = () => {
  const hiddenFileInput = useRef(null);
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const location = useLocation();
  const [settingsLock, setSettingsLock] = useState(false);

  useEffect(() => {
    if (location.pathname === '/settingslock') {
      setSettingsLock(true);
    } else {
      setSettingsLock(false);
    }
  }, [location.pathname]);

  const [file, setFile] = useState(
    location.pathname === '/settingslock'
      ? MGameWatch
      : null
  );

  const openGallery = () => {
    const dropdown = document.querySelector('.Download') as HTMLDetailsElement;
    if (dropdown) {
      dropdown.open = false;
    }
    document.getElementById('gallery').showModal();
  }

  const uploadFile = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    hiddenFileInput.current.click();
  };

  const handleChangeFile = async (e: any) => {
    const file = e.target.files[0];
    fileSize = file.size;

    if (fileSize > MAX_FILE_SIZE) {
      alert("La taille du fichier dépasse la limite de 4Mo");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await backRequest('users/avatar', 'POST', formData);
    if (!response.isOk) {
      alert(response.message);
    } else {
      setFile(`http://localhost:3333/uploads/${response.avatar}`);
    }

    const dropdown = document.querySelector('.Download') as HTMLDetailsElement;
    if (dropdown) {
      dropdown.open = false;
    }
  };

  const schema = Yup.object().shape({
    isF2Active: Yup.boolean().required(''),
    pseudo: Yup.string().when('settingsLock', {
      is: false,
      then: () =>
        Yup.string()
          .required("Nom d'utilisateur obligatoire")
          .min(3, 'Minimum 3 caractères')
          .max(20, 'Maximum 20 caractères')
          .matches(
            /^[0-9a-zA-Z-_]*$/,
            'Entrez des caractères valides'
          ),
      otherwise: () => Yup.string(),
    }),
    avatar: Yup.mixed().test(
      'fileSize',
      'Fichier trop volumineux',
      () => {
        return fileSize <= MAX_FILE_SIZE;
      }
    ),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      pseudo: '',
      isF2Active: user?.isF2Active ? true : false,
      avatar: { MGameWatch },
    },
  });

  const onSubmit = async (data: any) => {
    if (!settingsLock && data.pseudo === '')
      data.pseudo = user?.pseudo;
    if (file === null && user?.avatar !== null)
      data.avatar = user?.avatar
    else
      data.avatar = file;
    if (settingsLock && !data.pseudo)
      return;
    updateUser(settingsLock, {...data});
    if (settingsLock)
      navigate('/');
  };

  return (
    <div className="card-side card-bordered border-4 border-white bg-[#fbfaf3] shadow-xl p-12">
      <span className="font-display text-orangeNG text-3xl">
        Settings
      </span>
      <div className="px-32">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col pt-8 gap-y-3">
            <div className="avatar place-self-center ml-12">
              <div className="w-64 rounded-full ring ring-white ring-8 ring-offset-base-100 drop-shadow-md ring-offset-2">
                <img
                  src={file || user?.avatar}
                  alt="avatar"
                />
              </div>
              <details className="Download dropdown dropdown-right" open={false}>
                <summary className="btn btn-secondary rounded-full IconDownload">
                <svg
                  className=""
                  xmlns="http://www.w3.org/2000/svg"
                  height="50"
                  width="50"
                  viewBox="0 -960 960 960"
                  fill="white"
                >
                  <path d="M480-313 287-506l43-43 120 120v-371h60v371l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z" />
                </svg>
                </summary>
                <ul className="p-2 shadow menu dropdown-content z-[1] bg-white rounded-box w-38 font-display text-orangeNG text-md">
                  <li>
                    <button type="button" onClick={openGallery}>Gallery</button>
                  </li>
                  <li>
                    <button type="button" onClick={(e: any) => uploadFile(e)}>Import</button>
                  </li>
                </ul>
              </details>
              <input
                className="hidden"
                type="file"
                accept=".jpg, image/jpeg, .png"
                ref={hiddenFileInput}
                onChange={handleChangeFile}
              ></input>
            </div>
            <div className="basis-1/2">
              <SettingsInput settingsLock={settingsLock} register={register} errors={errors} />
              <hr className="border-neutral-500 mt-5" />
              <div className="form-control mt-3">
                <label className="label cursor-pointer">
                  <span className="label-text text-base">
                    2FA
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary"
                    defaultChecked={user?.isF2Active? true : false}
                    {...register('isF2Active')}
                  />
                </label>
              </div>
              <h1 className="label-text text-xs ml-1">
                L'authentification à deux facteurs permet de
                vous connecter en toute sécurité à votre
                compte afin de protéger vos données
                personnelles
              </h1>
              <div>
                <button
                  className="btn btn-secondary btn-block font-display mt-6 text-white"
                  type="submit"
                >
                  ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        </form>
        <Gallery setFile={setFile}/>
        {/* {!settingsLock && (
          <div className={"mt-5"}>
            <GameHistory />
          </div>
        )} */}
      </div>
    </div>
  );
};

export default SettingComp;
