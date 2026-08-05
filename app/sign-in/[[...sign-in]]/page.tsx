import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8f4e9] py-12">
            <SignIn />
        </div>
    );
}
