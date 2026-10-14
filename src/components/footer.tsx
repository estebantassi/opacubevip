import Link from "next/link";

export default function Footer() {
    return (
        <>
            <footer className="border-t-1 border-borderprimary shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-5 bg-content flex justify-center items-center h-25 gap-5">
                <Link href="/terms-of-services" className="hover:opacity-25 transition-opacity">Terms of Services</Link>
                <Link href="/privacy-policy" className="hover:opacity-25 transition-opacity">Privacy Policy</Link>
            </footer>
        </>
    );
}