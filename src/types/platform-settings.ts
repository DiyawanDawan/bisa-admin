export type PlatformSettingFieldType = "text" | "url" | "email" | "phone" | "number";

export interface PlatformSettingItem {
  key: string;
  label: string;
  description: string;
  type: PlatformSettingFieldType;
  placeholder: string;
  value: string;
  source: "database" | "environment" | "empty";
  updatedAt: string | null;
}
