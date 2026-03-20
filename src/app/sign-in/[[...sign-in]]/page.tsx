import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-wt-bg">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-wt-surface border-none shadow-2xl",
          },
        }}
      />
    </div>
  );
}
