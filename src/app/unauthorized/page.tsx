import { SignOutButton } from "@clerk/nextjs";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Acceso no autorizado</h1>
      <p className="text-muted-foreground max-w-sm">
        Tu cuenta no tiene permiso para acceder a esta aplicación.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <button className="text-sm underline text-muted-foreground">
          Cerrar sesión
        </button>
      </SignOutButton>
    </main>
  );
}
