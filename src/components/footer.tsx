import Link from "next/link";

export default function Footer() {
    return (
        <>
            <footer className="bg-content flex justify-center items-center h-25 gap-5">
                <Link href="/terms-of-services" className="hover:opacity-25 transition-opacity">Terms of Services</Link>
                <Link href="/privacy-policy" className="hover:opacity-25 transition-opacity">Privacy Policy</Link>
            </footer>
        </>
    );
}