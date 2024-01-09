import { useRef } from 'react';
import { useState } from 'react';
import MGameWatch from '../images/MGameWatch.png';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { backRequest, backResInterface, createUser } from '../api/queries';
import { useUser } from '../context/UserContext';

const MAX_FILE_SIZE: number = 1.3 * 1024 * 1024; // 1,3 Mo
let fileSize: number = 0;
let fileTest1: any;

const ModalSetting = () => {
  const hiddenFileInput = useRef(null);
  const [file, setFile] = useState(MGameWatch);
  const navigate = useNavigate();
  const {user} = useUser();

  const uploadFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    hiddenFileInput.current.click();
  };

  const handleChangeFile = (e: any) => {
    setFile(URL.createObjectURL(e.target.files[0]));
    fileSize = e.target.files[0].size;
    if
    fileTest1 = e.target.files[0];
  };

  const schema = Yup.object().shape({
    pseudo: Yup.string()
      .required('Nom d utilisateur obligatoire')
      .min(3, 'Minimum 3 caractères')
      .max(20, 'Maximum 20 caractères')
      .matches(
        /^[0-9a-zA-Z-_]*$/,
        'Entrez des caractères valides'
      ),
    isF2Active: Yup.boolean().required(''),
    avatar: Yup.mixed()
    .test('fileSize', 'Fichier trop volumineux', () => {
      return (fileSize <= MAX_FILE_SIZE);
    })
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      pseudo: '',
      isF2Active: false,
      avatar: {MGameWatch}
    },
  });

  const onSubmit = async (data: any) => {

    setUser({
      ...data,
      avatar: file
    })
    // createUser({...data, avatar: file});
    backRequest( 'auth/update', 'POST', {...data, avatar: file})
  };

  return (
    <>
      <button
        className="btn btn-ghost bg-white text-black hover:bg-gray-200"
        onClick={() => window.my_modal_1.showModal()}
      >
        42 LOGIN
      </button>

      <dialog id="my_modal_1" className="modal">
        <div className="modal-box w-11/12 max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex">
              <div className="basis-1/2">
                <h1 className="font-display text-4xl">
                  S'identifier
                </h1>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  className="input input-bordered w-full mt-6"
                  {...register('pseudo')}
                />
                {errors.pseudo && (
                  <span
                    style={{
                      color: '#db7706',
                      fontSize: '13px',
                    }}
                  >
                    {errors.pseudo.message}
                  </span>
                )}
                <hr className="border-neutral-500 mt-5" />
                <div className="form-control mt-3">
                  <label className="label cursor-pointer">
                    <span className="label-text text-base">
                      2FA
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary"
                      {...register('isF2Active')}
                    />
                  </label>
                </div>
                <h1 className="label-text text-xs ml-1">
                  L'authentification à deux facteurs permet
                  de vous connecter en toute sécurité à
                  votre compte afin de protéger vos données
                  personnelles
                </h1>
                <div>
                  <button
                    className="btn btn-secondary btn-block font-display mt-6"
                    type="submit"
                  >
                    ENREGISTRER
                  </button>
                </div>
              </div>
              <div className="avatar place-self-center ml-12">
                <div className="w-64 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                  <img src={file} />
                </div>
                <button
                  className="Download bg-secondary rounded-full justify-center items-center"
                  type="button"
                  onClick={(e: any) => uploadFile(e)}
                >
                  <svg
                    className=""
                    xmlns="http://www.w3.org/2000/svg"
                    height="35"
                    width="35"
                    viewBox="0 -960 960 960"
                    fill="white"
                  >
                    <path d="M480-313 287-506l43-43 120 120v-371h60v371l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z" />
                  </svg>
                </button>
                <input
                  className="hidden"
                  type="file"
                  accept=".jpg, image/jpeg, .png"
                  ref={hiddenFileInput}
                  onChange={handleChangeFile}
                ></input>
              </div>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button></button>
        </form>
      </dialog>
    </>
  );
};

export default ModalSetting;
