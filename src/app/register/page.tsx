"use client";

import { useState } from "react";
import { Button, Input } from "../../components/inputs";
import { RegisterFormInput, RegisterFormSchema, RegisterSchema, VerifySchema } from "../../schemas/register/schemas";

import srp from "secure-remote-password/client";
import { useToast } from "../../contexts/toastcontext";
import { register } from "../../server/auth/register";
import { APICall } from "../../lib/api";
import { verify } from "../../server/auth/verify/verify";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/authcontext";
import OAuth from "../../components/oauth";
import Link from "next/link";

export default function Register() {

    const { AddToast } = useToast();
    const { setUser } = useAuth();

    const [registerFormData, setRegisterFormData] = useState({
        username: { value: "", valid: false },
        email: { value: "", valid: false },
        emailcheck: { value: "", valid: false },
        password: { value: "", valid: false },
        passwordcheck: { value: "", valid: false },
    });

    const [showCodeForm, setShowCodeForm] = useState(false);
    const [code, setCode] = useState({ value: '', valid: false });

    const isFormValid = Object.values(registerFormData).every(field => field.valid);

    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    async function Register(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const values = Object.fromEntries(Object.entries(registerFormData).map(([k, v]) => [k, v.value]));
        const input = RegisterFormSchema.safeParse(values as RegisterFormInput);
        if (!input.success) return setError(input.error.issues[0]?.message ?? "Invalid input");

        const srpSalt = srp.generateSalt();
        const srpPrivatekey = srp.derivePrivateKey(srpSalt, registerFormData.email.value, registerFormData.password.value);
        const srpVerifier = srp.deriveVerifier(srpPrivatekey);

        //Request to the server
        const registerRequest = await APICall(register, {
            email: registerFormData.email.value,
            emailcheck: registerFormData.emailcheck.value,
            username: registerFormData.username.value,
            srpSalt: srpSalt,
            srpVerifier: srpVerifier
        }, RegisterSchema);
        if (!registerRequest.success) return AddToast(registerRequest.message, "error");

        setShowCodeForm(true);
    }

    async function Verify(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const verifyRequest = await APICall(verify, { code: code.value }, VerifySchema);
        if (!verifyRequest.success) return AddToast(verifyRequest.message, "error");

        setUser(verifyRequest.data.user);
        AddToast(verifyRequest.message, "success");

        return router.push('/home');
    }

    return (
        <>
            <div className={`w-full flex justify-center items-center`}>
                <form onSubmit={showCodeForm ? Verify : Register} className={`px-4 sm:my-20 sm:rounded-xl bg-content flex justify-center flex-col items-center w-full min-h-screen sm:min-h-full lg:w-[50vw] sm:w-[75vw] py-6`}>



                    {showCodeForm ? <>

                        <p className='text-center'>Please enter the verification code sent to your email below:</p>

                        <Input placeholder="Verification code" className='w-full lg:w-[50%] sm:w-[75%]' type="code" value={code.value} onChange={(e, valid) => setCode({ value: e.target.value, valid })} />

                        <Button disabled={!code.valid} type="submit" style="main">Verify account</Button>
                    </> : <>

                        <OAuth/>

                        <hr className="my-8 w-full lg:w-[75%]" />

                        <Input placeholder="Username" className='w-full lg:w-[50%] sm:w-[75%]' type="username" value={registerFormData.username.value} onChange={(e, valid) => setRegisterFormData(prev => ({ ...prev, username: { value: e.target.value, valid } }))} />
                        <Input placeholder="Email" className='w-full lg:w-[50%] sm:w-[75%]' type="email" value={registerFormData.email.value} onChange={(e, valid) => setRegisterFormData(prev => ({ ...prev, email: { value: e.target.value, valid } }))} />
                        <Input placeholder="Email verification" className='w-full lg:w-[50%] sm:w-[75%]' type="email" value={registerFormData.emailcheck.value} onChange={(e, valid) => setRegisterFormData(prev => ({ ...prev, emailcheck: { value: e.target.value, valid } }))} />
                        <Input placeholder="Password" className='w-full lg:w-[50%] sm:w-[75%]' type="password" value={registerFormData.password.value} onChange={(e, valid) => setRegisterFormData(prev => ({ ...prev, password: { value: e.target.value, valid } }))} />
                        <Input placeholder="Password verification" className='w-full lg:w-[50%] sm:w-[75%]' type="password" value={registerFormData.passwordcheck.value} onChange={(e, valid) => setRegisterFormData(prev => ({ ...prev, passwordcheck: { value: e.target.value, valid } }))} />
                        <p className='text-red-500'>{error || "\u00A0"}</p>

                        <Button disabled={!isFormValid} type="submit" style="main">Register</Button>

                        <p className='text-center mb-4'>Already have an account ? <Link className='text-blue-500 hover:opacity-75' href="/login">Login</Link></p>
                        <p className='text-center'>Your email is stored privately and securely.</p>
                        <p className='text-center'>Your password is not sent over the network. See <a className='text-blue-500 hover:opacity-75' target="_blank" href="https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol">SRP.</a></p>
                        <p className='text-center'>Want to see my code ? It{"'"}s on <a className='text-blue-500 hover:opacity-75' target="_blank" href="https://github.com/estebantassi">Github.</a></p>
                    </>}

                </form>
            </div>
        </>
    );
}