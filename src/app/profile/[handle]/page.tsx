"use client";

import { useAuth } from "@contexts/authcontext";
import Image from 'next/image'
import { use, useEffect, useState } from 'react'
import { User } from "src/types/types";
import { APICall } from "@lib/api";
import { getProfile } from "@server/profile/getprofile";
import { GetProfileSchema } from "src/schemas/profile/schemas";
import { useRouter } from "next/navigation";
import { useToast } from "src/contexts/toastcontext";
import ProfileEditor from "@components/profileeditor";
import { useImageViewer } from "@contexts/imageviewercontext";
import Bio from "@components/bio";

/* eslint-disable react-hooks/exhaustive-deps */
export default function Profile({
    params,
}: {
    params: Promise<{ handle: string }>
}) {

    const { handle } = use(params);

    const { isUserReady, user } = useAuth();

    const [pageUser, setPageUser] = useState<User | null>(null);

    const { AddToast } = useToast();
    const { ShowImage } = useImageViewer();

    const router = useRouter();

    useEffect(() => {
        if (!isUserReady) return;
        let isMounted = true;

        const getUser = async () => {
            if (handle === user?.handle && isMounted) return setPageUser(user);

            const request = await APICall(getProfile, { handle }, GetProfileSchema);
            if (!request.success) {
                router.push("/home");
                return AddToast(request.message, "error");
            }

            if (isMounted) setPageUser(request.data);
        };

        getUser();

        return () => { isMounted = false; };
    }, [isUserReady]);

    useEffect(() => {
        if (user?.handle === handle) setPageUser(user);
    }, [user])

    return (
        <div className="flex justify-center w-full">
            <div className="bg-content border-borderprimary border-r-1 border-l-1 lg:px-[2vw] flex flex-col min-h-screen max-w-[1000px] w-full lg:w-[75vw]">
 
                <div className="relative w-full aspect-[2.25]">
                    <div className="group hover:cursor-pointer overflow-hidden relative w-full">
                        {pageUser?.banner && <Image onClick={() => ShowImage(pageUser.banner)} unoptimized height={1} width={1} src={pageUser.banner} alt="banner" className="w-full" />}
                    </div>

                    <div className="group hover:cursor-pointer h-[50%] aspect-square absolute left-[3%] bottom-0 rounded-full overflow-hidden">
                        {pageUser?.avatar && <Image onClick={() => ShowImage(pageUser.avatar)} unoptimized height={1} width={1} src={pageUser.avatar} alt="avatar" className="w-full" />}
                    </div>
                </div>

                <div className="px-10">
                    {/* {pageUser?.banner && <Image onClick={() => ShowImage(pageUser.banner)} unoptimized height={1} width={1} src={pageUser.banner} alt="banner" className="w-full" />}
                    {pageUser?.avatar && <Image onClick={() => ShowImage(pageUser.avatar)} unoptimized height={1} width={1} src={pageUser.avatar} alt="avatar" className="w-[300]" />} */}
                    {pageUser?.username && <h2>{pageUser.username}</h2>}
                    {/* Show full bio on click */}
                    {pageUser?.biography && <Bio className="w-[50%]" text={pageUser.biography}/>}
                    {user && user.uuid === pageUser?.uuid && <ProfileEditor />}
                </div>
            </div>
        </div>
    );
}
