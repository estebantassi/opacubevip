"use client";

import Image from "next/image";
import { Button } from "@components/inputs";

export default function OAuth() {

    return (
        <>
            <div className='w-full flex flex-col items-center gap-2'>
                <Button type="button" className='bg-[#4285F4] w-full lg:w-[50%] sm:w-[75%] relative flex justify-center items-center' onClick={() => window.location.href = "/api/oauth/login?provider=google"}>
                    <Image className='w-8 bg-white p-1 absolute left-1' height={1} width={1} src="brands/google.svg" alt="google logo" />
                    Continue with Google
                </Button>

                <Button type="button" className='bg-[#FC6D26] w-full lg:w-[50%] sm:w-[75%] relative flex justify-center items-center' onClick={() => window.location.href = "/api/oauth/login?provider=gitlab"}>
                    <Image className='w-8 bg-white p-1 absolute left-1' height={1} width={1} src="brands/gitlab.svg" alt="gitlab logo" />
                    Continue with Gitlab
                </Button>

                <Button type="button" className='bg-[#5865F2] w-full lg:w-[50%] sm:w-[75%] relative flex justify-center items-center' onClick={() => window.location.href = "/api/oauth/login?provider=discord"}>
                    <Image className='w-8 bg-white p-1 absolute left-1' height={1} width={1} src="brands/discord.svg" alt="discord logo" />
                    Continue with Discord
                </Button>

                <Button type="button" className='bg-[#181717] w-full lg:w-[50%] sm:w-[75%] relative flex justify-center items-center' onClick={() => window.location.href = "/api/oauth/login?provider=github"}>
                    <Image className='w-8 bg-white p-1 absolute left-1' height={1} width={1} src="brands/github.svg" alt="github logo" />
                    Continue with Github
                </Button>

                <Button type="button" className='bg-[#9146FF] w-full lg:w-[50%] sm:w-[75%] relative flex justify-center items-center' onClick={() => window.location.href = "/api/oauth/login?provider=twitch"}>
                    <Image className='w-8 bg-white p-1 absolute left-1' height={1} width={1} src="brands/twitch.svg" alt="twitch logo" />
                    Continue with Twitch
                </Button>
            </div>
        </>
    );
}