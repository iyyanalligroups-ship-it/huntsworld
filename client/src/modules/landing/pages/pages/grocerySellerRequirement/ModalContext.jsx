// src/context/ModalContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


const ModalContext = createContext(undefined);

export const ModalProvider = ({ children }) => {
    const [modalContent, setModalContent] = useState(null);
    const [open, setOpen] = useState(false);

    const openModal = ({ title, component }) => {
        setModalContent({ title, component });
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        // Clear content after animation
        setTimeout(() => setModalContent(null), 300);
    };

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                {modalContent && (
                    <>
                        {modalContent.title && (
                            <DialogHeader>
                                <DialogTitle>{modalContent.title}</DialogTitle>
                            </DialogHeader>
                        )}
                        <DialogContent className="p-3 overflow-hidden bg-white"
                            // This forces exact 95vw width and 90vh height
                            style={{
                                width: "80vw",
                                maxWidth: "80vw",
                                height: "80vh",
                                maxHeight: "80vh",
                            }}>
                            {modalContent.component}
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within ModalProvider");
    }
    return context;
};
