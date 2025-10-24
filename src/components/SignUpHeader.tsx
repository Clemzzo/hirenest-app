import Link from "next/link";

export function SignUpHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#8C12AA] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-xl font-bold text-gray-900">HireNestly</span>
        </Link>
      </div>
    </header>
  );
}