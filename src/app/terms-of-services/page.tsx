export default function TermsOfServices() {

    return (
        <>
            <div className="flex justify-center">
                <div className="text-sm lg:text-base sm:rounded-xl p-10 bg-content flex flex-col gap-5 sm:m-4 lg:w-[50vw] sm:w-[75vw] w-full items-center [&>*]:w-full [&>h2]:text-lg lg:[&>h2]:text-2xl [&>h2]:font-bold">

                    <h1 className="text-3xl lg:text-5xl font-bold">Terms of Services</h1>

                    <p className="text-base lg:text-xl font-bold">By creating an account, you agree to the terms of services below.</p>

                    <h2>1. Eligibility</h2>
                    <p>
                        You represent and warrant that you are 18 years of age or older. Users under 18 must not create an account.
                        If we become aware that a user is underage, we reserve the right to restrict, suspend or permanently delete the account without notice.
                    </p>

                    <p>
                        The creation or use of accounts by automated means (including bots, scripts, or scrapers) is prohibited.
                        If we become aware of such activity, we reserve the right to restrict, suspend or permanently delete the account without notice.
                    </p>

                    <h2>2. Account & Security</h2>

                    <p>
                        Users are fully responsible for their account, the content they post, and the content they interact with.
                    </p>

                    <div>
                        <p>For security:</p>
                        <p>-Keep your login credentials private. Sharing accounts is not recommended.</p>
                        <p>-We provide two authentication methods:</p>
                        <div className="ml-4">
                            <p>-OAuth (Google, GitHub, GitLab, Twitch, Discord)</p>
                            <p>-Our own password-based system using SRP</p>
                        </div>
                        <p>-We recommend using our own authentication system.</p>
                    </div>

                    <h2>3. User Content & Conduct</h2>

                    <div>
                        <p>Prohibited content:</p>
                        <p>-Illegal content</p>
                        <p>-Harassment, hate speech, or threats</p>
                        <p>-Spam or scams</p>
                        <p>-Impersonation or misleading content</p>
                        <p>-Malware or malicious links</p>
                        <p>-Self-promotion or advertising</p>
                        <p>-Content related to religion, politics, ideologies, or personal debates</p>
                        <p>-Content intended to provoke arguments, debates, or create a toxic environment.</p>
                    </div>

                    <p>
                        Users own the entirety of their content.
                        By posting content, you grant us a non-exclusive, worldwide license to host and display that content within the platform.
                    </p>

                    <h2>4. Moderation & Termination</h2>

                    <p>
                        All of the content you remove is instantly (or almost) removed from our platform.
                    </p>

                    <p>
                        Account deletion will remove all of your data instantly, with the exception of private messages{"'"} images.
                        Said images are removed either instantly or during the next few days, they are stored encrypted with their access is revoked until deletion.
                    </p>

                    <p>
                        We reserve the right to permanently delete content if we believe it to breach our ToS.
                        We reserve the right to restrict, suspend or permanently delete accounts if we believe them to breach our ToS.
                        We reserve the right to restrict, suspend or permanently delete accounts of users who we determine, at our discretion, may engage in behavior or activities outside this platform that could harm the community, violate applicable laws, or contradict the principles of our service.
                        This includes, but is not limited to, illegal activity, harassment, or actions deemed morally or ethically harmful.
                        We are under no obligation to keep your content or data forever.
                    </p>

                    <h2>5. Limitation of Liability</h2>

                    <p>
                        Our services are provided “as is” and “as available.” We make no warranties, express or implied, regarding the availability, reliability, or suitability of our services.

                        We are not responsible for any content posted by users, including any loss, damage, or harm resulting from such content.

                        To the maximum extent permitted by law, in no event shall we be liable for indirect, incidental, special, or consequential damages, including loss of data, profits, or business opportunities, arising from your use of our services.

                        Our total liability for any claim arising out of your use of our services shall not exceed the amount you have paid, if any, to use our services.

                        We are not responsible for any third-party websites, services, or content linked to or from our services.

                        You agree to comply with all applicable laws when using our services, and we are not responsible for any legal consequences resulting from your misuse.
                    </p>

                    <h2>6. Changes to Terms</h2>

                    <p>
                        The ToS are subject to change. By agreeing to the ToS, you agree to keep up with the changes and follow them.
                    </p>

                    <h2>7. Governing Law</h2>

                    <p>
                        These Terms are governed by the laws of France, per the owner{"'"}s country of Residence. Any disputes shall be subject to the exclusive jurisdiction of the French courts.
                    </p>
                </div>
            </div>

        </>
    );
}