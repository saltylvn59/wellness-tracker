import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-[0.2em] pl-[0.2em]">DEVELOP</h1>
        <p className="text-sm tracking-widest text-muted">wellness tracker</p>
        <p className="pt-3 text-muted">Calories, macros, workouts, and cardio in one place.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-card p-3 text-center text-sm text-danger">
          Sign-in didn&apos;t work. Please try again.
        </p>
      )}

      <GoogleSignInButton />
    </main>
  );
}
