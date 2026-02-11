import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/20">
        <svg
          className="h-8 w-8 text-accent-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h1 className="gradient-text text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-text-secondary">
        We sent a verification link to your email address.
        Click the link to verify your account and get started.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm text-accent-primary hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
