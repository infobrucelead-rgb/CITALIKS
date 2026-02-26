import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <SignUp
                appearance={{
                    elements: {
                        formButtonPrimary: "bg-violet-600 hover:bg-violet-500 text-sm",
                        card: "glass border-white/5 shadow-2xl",
                        headerTitle: "text-white",
                        headerSubtitle: "text-white/60",
                        socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                        socialButtonsBlockButtonText: "text-white",
                        dividerLine: "bg-white/10",
                        dividerText: "text-white/40",
                        formFieldLabel: "text-white/70",
                        formFieldInput: "bg-white/5 border-white/10 text-white",
                        footerActionLink: "text-violet-400 hover:text-violet-300",
                        identityPreviewText: "text-white",
                        identityPreviewEditButtonIcon: "text-violet-400"
                    }
                }}
            />
        </div>
    );
}
