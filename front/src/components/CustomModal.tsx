import React from 'react';
import Modal from 'react-modal';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: 'calc(100vh - 210px)',
    },
};

Modal.setAppElement('#root');

export interface CustomModalProps {
    modalIsOpen: boolean;
    openModal: () => void;
    afterOpenModal: () => void;
    closeModal: () => void;
    modalContent: JSX.Element;
    contentLabel: string;
}

export function CustomModal({ modalIsOpen, openModal, afterOpenModal, closeModal, modalContent, contentLabel }: CustomModalProps,
) {
    return (
        <Modal
            isOpen={modalIsOpen}
            onAfterOpen={afterOpenModal}
            onRequestClose={closeModal}
            style={customStyles}
            // className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg outline-none"
            contentLabel={contentLabel}
        >
            {modalContent}
        </Modal>
    );
}

