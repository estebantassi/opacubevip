"use client";

import { useEffect, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Button } from "@components/inputs";
import { loadFFmpeg } from "@lib/ffmpeg";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import Spinner from "./spinner";
import { withLoading } from "@tools/loading";

type CropperContent = {
    image: File,
    aspect: number,
    handleCrop: (src: File) => Promise<void> | void
}

/* eslint-disable react-hooks/set-state-in-effect */
export default function ImageCropper({ image, aspect, handleCrop }: CropperContent) {

    const [isLoading, setIsLoading] = useState(false);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };
    const [imageURL, setImageURL] = useState("");

    const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);

    useEffect(() => {
        const initFFmpeg = async () => {
            try {
                const ffmpegInstance = await loadFFmpeg();
                setFfmpeg(ffmpegInstance);
            } catch (err) {
                console.log(err);
            }
        };
        initFFmpeg();
    }, []);

    useEffect(() => {
        const url = URL.createObjectURL(image);
        setImageURL(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [image]);

    const GetImageFromCrop = async (file: File, crop: Area) => {
        if (!ffmpeg) throw new Error("FFmpeg not loaded");

        const inputName = "input";
        const outputName = "output.webp";

        const data = await file.arrayBuffer();
        await ffmpeg.writeFile(inputName, new Uint8Array(data));

        await ffmpeg.exec([
            "-i", inputName,
            "-vf", `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,
            "-c:v", "libwebp",
            "-lossless", "1",
            "-loop", "0",
            outputName
        ]);

        const outputData = await ffmpeg.readFile(outputName);
        if (typeof outputData === "string") {
            throw new Error("Unexpected string output from FFmpeg");
        }

        const buffer = new Uint8Array(outputData).buffer;

        return new File([buffer], "cropped.webp", {
            type: "image/webp",
        });
    };

    const HandleCrop = async () => {
        if (!image || !croppedAreaPixels) return;
        await withLoading(async () => {

            const croppedImage = await GetImageFromCrop(image, croppedAreaPixels);
            handleCrop(croppedImage);
            
        }, isLoading, setIsLoading);
    };

    return (
        <>
            <div className="backdrop-blur-xs fixed flex h-full w-full justify-center items-center top-[0] left-[0] z-10">
                <div className="w-full h-full bg-content relative flex flex-col">
                    <div className="h-full w-full relative">
                        {isLoading && <Spinner/>}
                        <Cropper
                            image={imageURL}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <input
                        className="absolute bottom-[70] left-1/2 -translate-x-1/2"
                        type="range"
                        min="10"
                        max="30"
                        value={zoom * 10.0}
                        onChange={(e) => setZoom(Number(e.target.value) / 10.0)}
                    />

                    <Button type="button" className="absolute bottom-[20] left-1/2 -translate-x-1/2" style="main" onClick={HandleCrop}>Confirm</Button>
                </div>
            </div>
        </>
    );
}