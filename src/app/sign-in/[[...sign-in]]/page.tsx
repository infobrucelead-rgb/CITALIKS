import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
            <SignIn />
            <p className="mt-8 text-white/40 text-xs text-center max-w-sm">
                ¿Has olvidado tu contraseña?<br />
                <span className="text-white/60">Introduce primero tu correo electrónico y pulsa "Continuar" para ver la opción de recuperación.</span>
            </p>
        </div>
    );
}
