import Link from "next/link";
import Image from "next/image";
import hireLogo from "../../assets/hirelogo.png";

export function SignUpHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image src={hireLogo} alt="Hirenest logo" className="h-8 w-auto" priority />
        </Link>
      </div>
    </header>
  );
}