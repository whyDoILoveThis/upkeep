import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-125 h-125 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-100 h-100 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10">
        <SignUp />
      </div>
    </div>
  );
}
