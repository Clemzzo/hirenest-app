"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProviderSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    // Placeholder: persist to backend later
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-600">Choose how you want to be notified about new messages.</p>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />
                <span className="text-sm text-gray-800">Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" checked={pushNotifs} onChange={(e) => setPushNotifs(e.target.checked)} />
                <span className="text-sm text-gray-800">Push notifications</span>
              </label>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            {savedAt && <div className="text-xs text-gray-500">Saved at {savedAt}</div>}
            <Button onClick={save} disabled={saving} className="bg-[#8C12AA] hover:bg-[#8C12AA]">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}