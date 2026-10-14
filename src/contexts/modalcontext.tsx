"use client";

import { Button } from "@components/inputs";
import { createContext, use, useState, type ReactNode } from "react";

type ModalType = {
    ShowModal: (text: string,
        onConfirm?: () => void) => void;
};

export const ModalContext = createContext<ModalType | undefined>(undefined);

//improve this with pan and zoom on mouse
export const ModalProvider = ({ children }: { children: ReactNode }) => {

    const [text, setText] = useState<string | undefined>();
    const [trigger, setTrigger] = useState<(() => void) | undefined>();

    const ShowModal = (text: string, onConfirm?: () => void) => {
        setText(text);
        setTrigger(() => onConfirm);
    };

    const close = (confirmed: boolean = false) => {
        if (confirmed) trigger?.();

        setText(undefined);
        setTrigger(undefined);
    };

    return (
        <ModalContext value={{ ShowModal }}>
            {text && <div className="backdrop-blur-xs h-full w-full fixed flex justify-center items-center z-10">
                <div className="relative bg-content sm:rounded-xl p-4 w-full h-full sm:h-[75vh] lg:w-[50vw] sm:w-[75vw] flex justify-center items-center flex-col">
                    <h1>{text}</h1>

                    <div className="absolute bottom-4 right-4 flex gap-4">
                        <Button className="" style="main" type="button" onClick={() => close()}>
                            Cancel
                        </Button>
                        <Button className="" style="danger" type="button" onClick={() => close(true)}>
                            I understand
                        </Button>   
                    </div>
                </div>
            </div>}
            {children}
        </ModalContext>
    );
};

export function useModal() {
    const context = use(ModalContext);
    if (!context) { throw new Error("useModal must be used inside ModalProvider"); }
    return context;
}