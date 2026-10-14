"use client";

import { Button } from "@components/inputs";
import Image from "next/image";
import Link from "next/link";

export default function Home() {


    return (
        <div className={`w-full flex justify-center items-center`}>
            <div className={`relative px-4 sm:my-20 sm:rounded-xl bg-content flex justify-center flex-col items-center w-full min-h-screen sm:min-h-full lg:w-[50vw] sm:w-[75vw] py-6`}>

                <h2>Renaissance</h2>
                <p>Exploration, survival and adventure game in development</p>
                <Image className="w-[50%] rounded-lg mt-2" unoptimized width={1} height={1} src="/renaissancepreview.png" alt="Renaissance preview"/>
                <Button className="mt-2" style="main"><Link href="/renaissance/about">See More</Link></Button>
            </div>
        </div>
    );
}