import {useEffect, useState} from "react";
import {backRequest} from "../api/queries";
import React from 'react';
import QRCode from 'react-qr-code';
import {useNavigate} from "react-router-dom";
import { useUser } from "../context/UserContext";

const TwoFA: React.FC = () => {
    const {user, refreshUser} = useUser()
    const [urlPath, setUrlPath] = useState<string>('');
    const [code, setCode] = useState('');
    const [inputStyle, setInputStyle] = useState('');
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        backRequest('auth/twoFA', 'GET').then((data) => {
            setUrlPath(data.qrCodeUrl!);
        })
    }, []);

    useEffect(() => {
        if (user?.isF2authenticated)
            navigate('/')
    }, [user?.isF2authenticated])

    const submit = () => {
        backRequest('auth/verify', 'PUT', {codeQRAuth: code}).then(data => {
            if (data.verifyQrCode) {
                refreshUser();
                // navigate('/')
            } else {
                setInputStyle('border-rose-500')
                setIsError(true);
            }
            // sinon emettre une erreur
        })
    }

    return (
        <div className={"px-8 md:px-36 lg:px-96 xl:px-192 py-12"}>
            <div className="card border-4 border-white bg-[#fbfaf3] shadow-xl m-12">
                <figure className="px-10 pt-10">
                    {urlPath && (
                        <QRCode value={urlPath}/>
                    )}
                </figure>
                <div className="card-body items-center text-center">
                    <h2 className="card-title">Scan QRCode with Google authentificator,</h2>
                    <p>and enter your code: </p>
                    <input id={"codeQrCode"}
                           className={"input input-bordered w-full max-w-xs " + inputStyle}
                           type="text"
                           placeholder="Type code here"
                           onChange={(e) =>
                            setCode(e.target.value)}
                    />
                    {isError && (
                        <label htmlFor={"codeQrCode"} className={"text-rose-500"}>Wrong Code</label>
                    )}
                    <div className="card-actions">
                        <button className="btn btn-primary" onClick={submit}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TwoFA;
