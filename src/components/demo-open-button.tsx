"use client";

type FaztinoWidgetApi = {
  open?: (botId?: string) => void;
};

declare global {
  interface Window {
    FaztinoWidget?: FaztinoWidgetApi;
  }
}

export function DemoOpenButton({ className }: { className: string }) {
  function openDemo() {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth", block: "center" });

    const botId = process.env.NEXT_PUBLIC_DEMO_BOT_ID;
    let attempts = 0;

    const tryOpen = () => {
      attempts += 1;
      window.FaztinoWidget?.open?.(botId);
      window.dispatchEvent(new CustomEvent("faztino-demo-open", { detail: { botId } }));
      if (attempts < 8) {
        window.setTimeout(tryOpen, 150);
      }
    };

    tryOpen();
  }

  return (
    <button type="button" onClick={openDemo} className={className}>
      View live demo
    </button>
  );
}
