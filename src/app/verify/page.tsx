import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><div className="max-w-xl mx-auto px-4 py-16">Loading...</div></div>}>
      <VerifyClient />
    </Suspense>
  );
}