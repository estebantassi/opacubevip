import { useEffect, useRef, useState } from "react";

type BioContent = {
    text: string;
    className?: string;
}

export default function Bio({ text, className }: BioContent) {
    const ref = useRef<HTMLParagraphElement | null>(null);
    const [isClamped, setIsClamped] = useState<boolean>(false);
    const [show, setIsShow] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        setIsClamped(el.scrollHeight !== el.clientHeight);
    }, [text]);

    return (
        <>
            <div className={`${className}`}>
                <p ref={ref} className={`whitespace-pre-line ${!show && 'line-clamp-3'}`}>{text}</p>
                {isClamped && <button onClick={() => setIsShow(prev => !prev)} className="hover:cursor-pointer hover:underline text-neutral-500">{show ? "Hide full bio" : "Show full bio"}</button>}
            </div>
        </>
    );
}