"use client";


export default function Spinner() {

    return (
        <>
        <div className="absolute w-full h-full">
            <div className="backdrop-blur-xs relative w-full h-full flex justify-center items-center z-10 gap-2">
                <span className="rounded-full w-10 h-10 spinner"></span>
            </div>
        </div>
        </>
    );
}