"use client";

import { useCallback, useState } from "react";

interface ServiceRow {
  id: string;
  name: string;
  durationMin: number;
  description: string | null;
  price: string | null;
  active: boolean;
}

export function ServicesPanel({ botId, initial }: { botId: string; initial: ServiceRow[] }) {
  const [services, setServices] = useState<ServiceRow[]>(initial);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const addService = useCallback(async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/bots/${botId}/booking/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          durationMin: duration,
          price: price.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { service: ServiceRow };
        setServices((prev) => [...prev, j.service]);
        setName("");
        setDuration(30);
        setPrice("");
        setDescription("");
      }
    } catch { /* ignore */ }
    setAdding(false);
  }, [botId, name, duration, price, description]);

  const toggleActive = useCallback(
    async (svc: ServiceRow) => {
      const res = await fetch(`/api/bots/${botId}/booking/services/${svc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !svc.active }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === svc.id ? { ...s, active: !s.active } : s))
        );
      }
    },
    [botId]
  );

  const deleteService = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/bots/${botId}/booking/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [botId]
  );

  return (
    <div className="space-y-6">
      {/* Existing services */}
      {services.length > 0 && (
        <div className="space-y-2">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm ${
                svc.active ? "border-gray-100" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{svc.name}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {svc.durationMin} min
                  </span>
                  {svc.price && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                      {svc.price}
                    </span>
                  )}
                </div>
                {svc.description && (
                  <p className="mt-0.5 text-sm text-gray-500 truncate">{svc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => toggleActive(svc)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    svc.active
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {svc.active ? "Active" : "Inactive"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteService(svc.id)}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new service */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Add Service</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Haircut, Consultation"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price (optional)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. $50, Free, From $30"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-[#0d9488]/25 focus:border-[#0d9488]"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addService}
          disabled={adding || !name.trim()}
          className="mt-3 rounded-full bg-[#0d9488] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0b7f6f] disabled:opacity-50 transition-colors"
        >
          {adding ? "Adding…" : "Add Service"}
        </button>
      </div>
    </div>
  );
}
