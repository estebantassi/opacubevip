import { CircleX, CircleCheck, CircleAlert, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ToastContent } from "@mytypes/toast/types";

export const Toast = ({ text, type, duration }: ToastContent) => {

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const start = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const percent = Math.min((elapsed / duration) * 100, 100);
            setProgress(percent);
        }, 16);

        return () => clearInterval(interval);
    }, [duration]);

    return (
        <>
            <div className={`bg-accent flex flex-col rounded font-medium shadow-lg`}>
                <div
                    className={`flex gap-2 items-center py-2 px-4`}
                >

                    {type == "error" && <CircleX className={`shrink-0 text-red-500`} />}
                    {type == "success" && <CircleCheck className={`shrink-0 text-green-500`} />}
                    {type == "info" && <Info className={`shrink-0 text-black-500`} />}
                    {type == "warning" && <CircleAlert className={`shrink-0 text-yellow-500`} />}

                    <div className='break-words min-w-0'>
                        {text}
                    </div>
                </div>

                <div className="w-full rounded-full h-1 mt-2 overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

        </>
    );
};