"use client";

import { Button, Input } from "@components/inputs";
import { useAuth } from "@contexts/authcontext";
import { languages } from "@prisma/enums";
import Image from "next/image";
import { useState } from "react";
import Select from "react-select";

export default function Page() {

    const { user } = useAuth();

    const PostNewVoiceLog = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        
        console.log("hey");
    }

    const [voiceLog, setVoiceLog] = useState({
        lines: { value: "", valid: false },
    });


    const [language, setLanguage] = useState<languages | undefined>(undefined);

    const languageList = Object.values(languages);

    const languagesObject = languageList.map((lang) => ({
        value: lang,
        label: lang,
        flag: `https://flagcdn.com/${lang.toLowerCase()}.svg`,
    }));

    return (
        <div className={`w-full flex justify-center items-center`}>
            <div className={`relative px-4 sm:my-20 sm:rounded-xl bg-content flex justify-center flex-col items-center w-full min-h-screen sm:min-h-full lg:w-[50vw] sm:w-[75vw] py-6`}>
                <h1>Renaissance - Voice Acting</h1>

                {user && user?.admin && <>
                    <form onSubmit={PostNewVoiceLog} className="w-full">
                        <Input textarealength={500} type="textarea" placeholder="Voice lines" value={voiceLog.lines.value} onChange={(e, valid) => setVoiceLog(prev => ({ ...prev, lines: { value: e.target.value, valid } }))}></Input>

                        <Select
                            options={languagesObject}
                            value={languagesObject.find((o) => o.value === language) ?? null}
                            onChange={(option) => setLanguage(option?.value)}
                            getOptionLabel={(e) => e.label}
                            formatOptionLabel={(option) => (
                                <div className="flex text-black gap-20">
                                    <Image src={option.flag} width={32} height={24} alt="" />
                                    <span>{option.label}</span>
                                </div>
                            )}
                        />

                        <Button type="submit" style="main">Post voice log</Button>
                    </form>
                </>}

                <h2></h2>
            </div>
        </div>
    );
}