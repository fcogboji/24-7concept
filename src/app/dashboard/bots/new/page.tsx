import Link from "next/link";
import { NewBotForm } from "./new-bot-form";

export default function NewBotPage() {
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        ← Back
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-stone-900">
        New assistant
      </h1>
      <p className="mt-2 text-stone-600">
        Give it a name customers will recognize. Add your public website — we will crawl it when you train.
      </p>
      <div className="mt-8 max-w-md">
        <NewBotForm />
      </div>
    </div>
  );
}
