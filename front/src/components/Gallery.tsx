import React, { useState } from 'react';
import MGameWatch from '../images/MGameWatch.png';
import Riri from '../images/La-tranche-sur-riri.jpg';

const Gallery: React.FC = ({ setFile }) => {
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const handleImageClick = (imageName: string) => {
    setSelectedImage(
      imageName === selectedImage ? null : imageName
    );
  };

  const handleSelectClick = () => {
    if (selectedImage === 'riri') setFile(Riri);
    else if (selectedImage === 'mGameWatch') setFile(MGameWatch);
    console.log("🚀 ~ file: Gallery.tsx:18 ~ handleSelectClick ~ selectedImage:", selectedImage)
  };

  return (
    <>
      <dialog id="gallery" className="modal">
        <div className="modal-box card card-bordered border-white border-4">
          <h3 className="font-display text-orangeNG text-lg">
            Choose an avatar
          </h3>
          <div className="flex flex-row mt-5 gap-5">
            <div className="avatar">
              <div
                className={`w-24 rounded ring cursor-pointer ${
                  selectedImage === 'riri'
                    ? 'ring-orangeNG'
                    : 'ring-white'
                }`}
                onClick={() => handleImageClick('riri')}
              >
                <img src={Riri} alt="Riri" />
              </div>
            </div>
            <div className="avatar">
              <div
                className={`w-24 rounded ring cursor-pointer ${
                  selectedImage === 'mGameWatch'
                    ? 'ring-orangeNG'
                    : 'ring-white'
                }`}
                onClick={() =>
                  handleImageClick('mGameWatch')
                }
              >
                <img src={MGameWatch} alt="MGameWatch" />
              </div>
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn btn-secondary font-display text-white"
                onClick={handleSelectClick}
              >
                Select
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default Gallery;
