"use client";

import { BotAppearancePanel } from "./bot-appearance-panel";
import { BotIntegrationPanel } from "./bot-integration-panel";

type Bot = {
  id: string;
  name: string;
  isDemo: boolean;
};

export function BotWidgetSetupGrid({
  botName,
  bot,
  embedSnippet,
}: {
  botName: string;
  bot: Bot;
  embedSnippet: string;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
      <div className="min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Widget appearance</h2>
          <p className="mt-1 text-sm text-gray-600">Customize how the bot looks on your site.</p>
        </div>
        <BotAppearancePanel botName={botName} compact />
      </div>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Integration</h2>
            <p className="mt-1 text-sm text-gray-600">Add the bot to your website.</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Active
          </span>
        </div>
        <BotIntegrationPanel bot={bot} embedSnippet={embedSnippet} compact />
      </div>
    </div>
  );
}
