import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="glass rounded-xl px-4 py-2 text-sm text-muted hover:text-foreground flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-125 h-125 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-100 h-100 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10">
        <SignIn />
      </div>
    </div>
  );
}
