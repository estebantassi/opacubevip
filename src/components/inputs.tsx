import { useState } from "react";
import z from "zod";
import { Code, Email, Password, Username } from "@mytypes/types";
import { Info } from 'lucide-react';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
} from "@floating-ui/react-dom";

type InputContent = {
    validate?: boolean;
    placeholder?: string;
    type?: "email" | "username" | "password" | "text" | "code";
    value?: string;
    className?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>, valid: boolean) => void;
};

export const Input = ({ validate = false, placeholder = "", type = "text", value = "", className = "", onChange }: InputContent) => {

    const [error, setError] = useState<string | null>(null);
    const [show, setShow] = useState(false);

    const { refs, floatingStyles } = useFloating({
        open: show,
        middleware: [
        offset(8),
        flip(),
        shift(),
        ],
        whileElementsMounted: autoUpdate,
    });

    async function handleChange(e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) {
        if (!validate) if (onChange) onChange(e, true);

        let schema: z.ZodType | null = null;
        switch (type) {
            case "email":
                schema = Email;
                break;
            case "username":
                schema = Username;
                break;
            case "password":
                schema = Password;
                break;
            case "code":
                schema = Code;
                break;
            default:
                if (onChange) onChange(e, true);
                return;
        }

        const input = schema.safeParse(e.target.value);
        if (!input.success) setError(input.error.issues[0]?.message ?? "Invalid input");
        else setError(null);

        if (onChange) onChange(e, input.success);
    }

    return (
        <>
            <div className={`${className} relative m-2`}>
                <input placeholder={placeholder} value={value} onChange={(e) => handleChange(e)} type={type === "password" ? "password" : "text"} className={`w-full rounded-lg p-2 ${error ? 'pr-10 outline outline-red-500' : 'outline-none'} bg-accent`} />

                {error && <Info
                    ref={refs.setReference}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:cursor-pointer"
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                />}

                {show && error &&
                    /* eslint-disable react-hooks/refs */
                    <div
                        ref={refs.setFloating} style={floatingStyles}
                        className="select-none w-max p-2 bg-black text-white text-sm rounded-md z-[9999]">
                        {error}
                    </div>
                    /* eslint-enable react-hooks/refs */
                }
            </div>
        </>

    );
};

type ButtonContent = {
    disabled?: boolean;
    style?: "none" | "main" | "danger";
    type?: undefined | "button" | "submit" | "reset";
    className?: string;
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const Button = ({ disabled = false, children, onClick, style = "none", type, className = "" }: ButtonContent) => {

	const styles = {
		"none": "",
		"main": `bg-black`,
		"danger": `bg-red-500 text-white`,
	};

	return (
		<button
			disabled={disabled}
			onClick={onClick}
			className={`${className} ${styles[style]} px-4 py-2 rounded font-medium transition-colors hover:cursor-pointer ${disabled ? "opacity-25" : "hover:opacity-75 transition-opacity"}`}
			type={type}
		>
			{children}
		</button>
	);
};