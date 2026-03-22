"use client";

import { Button, Input } from "../../components/inputs";
import { login, loginStart } from "../../server/auth/login";
import { LoginSchema, LoginStartSchema } from "../../schemas/login/schemas";
import { useState } from "react";
import { useToast } from "../../contexts/toastcontext";
import srp from "secure-remote-password/client";
import { useAuth } from "../../contexts/authcontext";
import { useRouter } from "next/navigation";
import { APICall } from "../../lib/api";
import { validateSchema } from "../../lib/tools";
import OAuth from "../../components/oauth";
import Link from "next/link";

export default function Login() {

    const [loginFormData, setLoginFormData] = useState({
        email: { value: "", valid: false },
        password: { value: "", valid: false },
    });

    const { AddToast } = useToast();
    const { setUser } = useAuth();

    const [error, setError] = useState<string | null>(null);

    const isFormValid = Object.values(loginFormData).every(field => field.valid);

    const router = useRouter();

    async function Login(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        //rare case of manually checking input, because we need the error to be shown.
        const input = validateSchema({ email: loginFormData.email.value}, LoginStartSchema);
        if (!input.success) return setError(input.message);
        
        const fetchSRP = await APICall(loginStart, { email: loginFormData.email.value }, LoginStartSchema);
        if (!fetchSRP.success) return AddToast(fetchSRP.message, "error");

        const srpSalt = fetchSRP.data.srpSalt;
        const srpServerEphemeral = fetchSRP.data.srpServerEphemeral;

        const srpClientEphemeral = srp.generateEphemeral();
        const srpPrivateKey = srp.derivePrivateKey(srpSalt, loginFormData.email.value, loginFormData.password.value);
        const srpClientSession = srp.deriveSession(srpClientEphemeral.secret, srpServerEphemeral, srpSalt, loginFormData.email.value, srpPrivateKey);

        const loginRequest = await APICall(login, {email: input.data.email, srpProof: srpClientSession.proof, srpEphemeral: srpClientEphemeral.public }, LoginSchema);
        if (!loginRequest.success) return AddToast(loginRequest.message, "error");

        try { srp.verifySession(srpClientEphemeral.public, srpClientSession, loginRequest.data.srpProof); } catch {
            return AddToast("There was an error verifying the server's authenticity", "error");
        }

        setUser(loginRequest.data.user);
        AddToast(loginRequest.message, "success");

        return router.push('/profile/' + loginRequest.data.user.uuid);
    }

    return (
        <>
            <div className={`w-full flex justify-center items-center`}>
                <form onSubmit={Login} className={`px-4 sm:my-20 sm:rounded-xl bg-content flex justify-center flex-col items-center w-full min-h-screen sm:min-h-full lg:w-[50vw] sm:w-[75vw] py-6`}>

                    <OAuth/>

                    <hr className="my-8 w-full lg:w-[75%]" />

                    <Input placeholder="Email" className='w-full lg:w-[50%] sm:w-[75%]' type="email" value={loginFormData.email.value} onChange={(e, valid) => setLoginFormData(prev => ({ ...prev, email: { value: e.target.value, valid } }))} />
                    <Input validate={false} placeholder="Password" className='w-full lg:w-[50%] sm:w-[75%]' type="password" value={loginFormData.password.value} onChange={(e, valid) => setLoginFormData(prev => ({ ...prev, password: { value: e.target.value, valid } }))} />
                    <p className='text-red-500'>{error || "\u00A0"}</p>

                    <Button disabled={!isFormValid} type="submit" style="main">Login</Button>

                    <p className='text-center'>No account ? <Link className='text-blue-500 hover:opacity-75' href="/register">Create one</Link></p>
                </form>
            </div>
        </>
    );

}