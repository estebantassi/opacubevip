"use client";

import Image from "next/image";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

type ImageViewerType = {
    ShowImage: (image: string) => void;
};

export const ImageViewerContext = createContext<ImageViewerType | undefined>(undefined);

//improve this with pan and zoom on mouse
export const ImageViewerProvider = ({ children }: { children: ReactNode }) => {

    const [image, setImage] = useState<string | undefined>();
    const [scale, setScale] = useState(1);

    const ShowImage = (image: string) => {
        setImage(image);
    };

    const close = () => {
        setImage(undefined);
        setScale(1);
    };

    useEffect(() => {
        if (!image) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.3 : 0.3;
            setScale(prev => Math.min(Math.max(prev + delta, 0.2), 5));
        };

        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("wheel", handleWheel);
        };
    }, [image]);

    return (
        <ImageViewerContext value={{ ShowImage }}>
            {image && <div  onClick={() => close()}className="backdrop-blur-xs h-full w-full fixed flex justify-center items-center z-10">
                <Image className="w-auto h-auto" unoptimized onClick={(e) => e.stopPropagation()} style={{ transform: `scale(${scale})` }} width={1} height={1} src={image} alt="viewed image"/>
            </div>}
            {children}
        </ImageViewerContext>
    );
};

export function useImageViewer() {
    const context = use(ImageViewerContext);
    if (!context) { throw new Error("useImageViewer must be used inside ImageViewerProvider"); }
    return context;
}