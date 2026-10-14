"use client";

import { Button } from "@components/inputs";
import Link from "next/link";

export default function Page() {

    return (
        <div className={`w-full flex justify-center items-center`}>
            <div className={`relative px-4 sm:my-20 sm:rounded-xl bg-content flex justify-center flex-col items-center w-full min-h-screen sm:min-h-full lg:w-[50vw] sm:w-[75vw] py-6`}>
                <h1>Renaissance</h1>

                <div className="bg-highlightcontent p-4 rounded-lg">
                    <h2>{"I need your voice !"}</h2>
                    <p>{"If you want to help me, you can voice act in my game, and you don't even need to speak english !"}</p>
                    <p>{"The main voicelines will be in english, no matter the accent, but all the side stories will be available in any language !"}</p>
                    <p>{"Pick a character, act its lines, and if you stand out, i'll use all of your lines !"}</p>
                    <Button style="main"><Link href="/renaissance/voiceacting">Try it out !</Link></Button>
                </div>
            </div>
        </div>
    );
}