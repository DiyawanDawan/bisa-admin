import { apiGet, apiPut } from "@/lib/api-client";
import type { PlatformSettingItem } from "@/types/platform-settings";

export async function fetchPlatformSettingsAdmin(): Promise<PlatformSettingItem[]> {
  const res = await apiGet<PlatformSettingItem[]>("/admin/platform-settings");
  return res.data;
}

export async function savePlatformSettingsAdmin(
  settings: Record<string, string>,
): Promise<PlatformSettingItem[]> {
  const res = await apiPut<PlatformSettingItem[]>("/admin/platform-settings", {
    settings,
  });
  return res.data;
}
