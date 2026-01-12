import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <div className="relative mx-auto h-52 w-52">
        <Image src="/error.gif" alt="Error" fill sizes="208px" className="object-contain" />
      </div>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted">We couldn&apos;t find what you were looking for.</p>
      <div className="flex justify-center">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
