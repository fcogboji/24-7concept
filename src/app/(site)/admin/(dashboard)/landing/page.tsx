import Link from "next/link";
import { getDemoVideo } from "@/lib/site-settings";
import { DemoVideoForm } from "./demo-video-form";

export default async function AdminLandingPage() {
  const { video, label } = await getDemoVideo();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Landing page
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Set the demo video shown under the hero on{" "}
        <Link href="/" className="font-medium text-teal-800 underline" target="_blank" rel="noreferrer">
          the public site
        </Link>
        . The section is hidden while no video is set.
      </p>

      <DemoVideoForm initialUrl={video?.url ?? ""} initialLabel={label ?? ""} />

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Preview</h2>
        {video ? (
          <>
            <p className="mt-1 text-xs text-stone-500">
              Provider: <span className="font-medium text-stone-700">{video.provider}</span>
            </p>
            <div className="mt-4 aspect-video w-full max-w-xl overflow-hidden rounded-xl border border-stone-200 bg-stone-900">
              <iframe
                src={video.embedUrl}
                title="Demo video preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            No video set yet — the landing page skips the section entirely.
          </p>
        )}
      </div>
    </div>
  );
}
