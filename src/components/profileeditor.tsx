"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@components/inputs";
import Image from "next/image";
import ImageCropper from "@components/imagecropper";
import { useToast } from "@contexts/toastcontext";
import { supportedFormats } from "@lib/ffmpeg";
import { useAuth } from "@contexts/authcontext";
import { editProfile } from "@server/profile/editprofile";
import { EditProfileSchema } from "@schemas/profile/schemas";
import Spinner from "./spinner";
import { Avatar, Banner } from "@mytypes/types";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { withLoading } from "@tools/loading";

export default function ProfileEditor() {
    const { user, APICallAuth, setUser } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [show, setShow] = useState(false);

    const [avatar, setAvatar] = useState(user?.avatar ?? "");
    const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
    const [showAvatarCropper, setShowAvatarCropper] = useState(false);

    const [banner, setBanner] = useState(user?.banner ?? "");
    const [bannerFile, setBannerFile] = useState<File | undefined>(undefined);
    const [showBannerCropper, setShowBannerCropper] = useState(false);
    
    const { AddToast } = useToast();
    const router = useRouter();

    //Disable scroll behind this element
    useEffect(() => {
        if (!show) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => { document.body.style.overflow = originalOverflow; };
    }, [show]);

    const handleAvatarCrop = async (croppedImage: File) => {
        if (avatar?.startsWith("blob:")) URL.revokeObjectURL(avatar);
        setAvatarFile(croppedImage);
        setAvatar(URL.createObjectURL(croppedImage));
        setShowAvatarCropper(false);
    };

    const handleBannerCrop = async (croppedImage: File) => {
        if (banner?.startsWith("blob:")) URL.revokeObjectURL(banner);
        setBannerFile(croppedImage);
        setBanner(URL.createObjectURL(croppedImage));
        setShowBannerCropper(false);
    };

    const [editProfileFormData, setEditProfileFormData] = useState({
        username: { value: user?.username ?? "", valid: false },
        handle: { value: user?.handle ?? "", valid: false },
        biography: { value: user?.biography ?? "", valid: false },
    });

    const [isFormValid, setIsFormValid] = useState(false);
    useEffect(() => {
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        if (editProfileFormData.username.value !== user?.username && !editProfileFormData.username.valid) return setIsFormValid(false);

        if (editProfileFormData.handle.value !== user?.handle && !editProfileFormData.handle.valid) return setIsFormValid(false);

        if (editProfileFormData.biography.value !== user?.biography && !editProfileFormData.biography.valid) return setIsFormValid(false);

        if (
            editProfileFormData.username.value === user?.username &&
            editProfileFormData.handle.value === user?.handle &&
            editProfileFormData.biography.value === user?.biography &&
            !avatarFile && !bannerFile
        ) return setIsFormValid(false);

        setIsFormValid(true);
    }, [editProfileFormData, user, avatarFile, bannerFile]);

    const EditProfile = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        await withLoading(async () => {

            const usernameToSend = editProfileFormData.username.valid ? editProfileFormData.username.value : undefined;
            const handleToSend = editProfileFormData.handle.valid ? editProfileFormData.handle.value : undefined;
            const biographyToSend = editProfileFormData.biography.valid ? editProfileFormData.biography.value : undefined;
            
            if (!usernameToSend && !avatarFile && !bannerFile && !handleToSend && !biographyToSend) return Close();

            const request = await APICallAuth(editProfile, {
                username: usernameToSend,
                avatar: avatarFile,
                banner: bannerFile,
                handle: handleToSend,
                biography: biographyToSend
            }, EditProfileSchema);

            if (!request.success) return AddToast(request.message, "error");

            setUser(prev => {
                if (!prev) return null;
                return { ...prev,
                    ...(request.data.avatar && { avatar: request.data.avatar }),
                    ...(request.data.banner && { banner: request.data.banner }),
                    ...(request.data.handle && { handle: request.data.handle }),
                    ...(request.data.biography && { biography: request.data.biography }),
                    ...(request.data.username && { username: request.data.username })
                };
            });

            if (request.data.handle) router.replace(`/profile/${request.data.handle}`);

            Close(
                request.data.avatar ?? undefined,
                request.data.banner ?? undefined,
                request.data.username ?? undefined,
                request.data.handle ?? undefined,
                request.data.biography ?? undefined
            );

            AddToast(request.message, "success");
        }, isLoading, setIsLoading);
    }

    const Close = async (avatar?: string, banner?: string, username?: string, handle?: string, biography?: string) => {
        if (avatar?.startsWith("blob:")) URL.revokeObjectURL(avatar);
        if (banner?.startsWith("blob:")) URL.revokeObjectURL(banner);

        setEditProfileFormData({
            username: { value: username ?? user?.username ?? "", valid: false },
            handle: { value: handle ?? user?.handle ?? "", valid: false },
            biography: { value: biography ?? user?.biography ?? "", valid: false },
        })
        setAvatar(avatar ?? user?.avatar ?? "");
        setBanner(banner ?? user?.banner ?? "");
        setAvatarFile(undefined);
        setBannerFile(undefined);
        setIsLoading(false);
        setShow(false);
    }

    return (
        <>

            {show && <>
                <div className="backdrop-blur-xs fixed flex h-full w-full justify-center items-center top-[0] left-[0] z-10">
                    <form onSubmit={EditProfile} className="shadow-xl/20 sm:rounded-xl w-[95%] h-[95%] lg:w-[50%] lg:h-[75%] bg-content flex flex-col overflow-auto relative">
                        {isLoading && <Spinner />}
                        <input
                            hidden
                            type="file"
                            accept={`${supportedFormats.map(ext => `.${ext}`).join(",")}`}
                            id="avatar-upload"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const files = e.target.files;
                                if (files && files[0]) {
                                    const input = Avatar.safeParse(files[0]);
                                    if (!input.success) return AddToast(input.error.issues[0]?.message ?? "Invalid input", "error");

                                    const imageUrl = URL.createObjectURL(input.data);
                                    setAvatar(imageUrl);
                                    setAvatarFile(input.data);
                                    setShowAvatarCropper(true);
                                }
                            }}
                        />

                        <input
                            hidden
                            type="file"
                            accept={`${supportedFormats.map(ext => `.${ext}`).join(",")}`}
                            id="banner-upload"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const files = e.target.files;
                                if (files && files[0]) {
                                    const input = Banner.safeParse(files[0]);
                                    if (!input.success) return AddToast(input.error.issues[0]?.message ?? "Invalid input", "error");

                                    const imageUrl = URL.createObjectURL(input.data);
                                    setBanner(imageUrl);
                                    setBannerFile(input.data);
                                    setShowBannerCropper(true);
                                }
                            }}
                        />

                        {avatarFile && showAvatarCropper && <>
                            <ImageCropper image={avatarFile} aspect={1} handleCrop={handleAvatarCrop} />
                        </>}

                        {bannerFile && showBannerCropper && <>
                            <ImageCropper image={bannerFile} aspect={3/1} handleCrop={handleBannerCrop} />
                        </>}

                        <div className="relative w-full aspect-[2.25]">
                            <label htmlFor="banner-upload" className="group hover:cursor-pointer overflow-hidden relative w-full">
                                <Image unoptimized src={banner} alt="banner" width={1} height={1} className="w-full" />
                                    
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageUp className="h-10 w-10 text-white" />
                                </div>
                            </label>

                            <label htmlFor="avatar-upload" className="group hover:cursor-pointer aspect-square h-[50%] absolute left-[3%] bottom-0 bg-black rounded-full overflow-hidden">
                                <Image unoptimized src={avatar} alt="avatar" width={1} height={1} className="w-full" />
                            
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageUp className="h-10 w-10 text-white" />
                                </div>
                            </label>
                        </div>

                        <label htmlFor="username" className="pl-2">Username</label>
                        <Input className="m-2" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} placeholder="Username" type="username" value={editProfileFormData.username.value} onChange={(e, valid) => setEditProfileFormData(prev => ({ ...prev, username: { value: e.target.value, valid } }))} />
                        
                        <label htmlFor="handle" className="pl-2">Handle</label>
                        <Input className="m-2" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} placeholder="Handle" type="handle" value={editProfileFormData.handle.value} onChange={(e, valid) => setEditProfileFormData(prev => ({ ...prev, handle: { value: e.target.value, valid } }))} />
                        
                        <label htmlFor="biography" className="pl-2">Biography</label>
                        <Input className="m-2" placeholder="Biography" type="biography" value={editProfileFormData.biography.value} onChange={(e, valid) => setEditProfileFormData(prev => ({ ...prev, biography: { value: e.target.value, valid } }))} />

                        <div className="flex justify-end mt-auto gap-2">
                            <Button className="mb-4" style="main" type="button" onClick={() => Close()}>Close</Button>
                            <Button disabled={!isFormValid} className="mb-4 mr-4" style="accept" type="submit">Save</Button>
                        </div>
                    </form>
                </div>
            </>
            }
            <Button style="main" onClick={() => { setShow(true); }}>Edit Profile</Button>
        </>
    );
}