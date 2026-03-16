import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <IconArrowLeft size={16} />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
