"use client";

import { useEffect, useState } from "react";
import { remoteConfig } from "@/lib/firebase/config";
import { fetchAndActivate, getValue } from "firebase/remote-config";

export function useRemoteConfig(key: string, defaultValue: any) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!remoteConfig) return;

    const fetchConfig = async () => {
      try {
        if (!remoteConfig) return;
        await fetchAndActivate(remoteConfig);
        const val = getValue(remoteConfig, key);
        if (typeof defaultValue === 'boolean') {
            setValue(val.asBoolean());
        } else if (typeof defaultValue === 'number') {
            setValue(val.asNumber());
        } else {
            setValue(val.asString());
        }
      } catch (error) {
        console.error("Remote Config fetch failed", error);
      }
    };

    fetchConfig();
  }, [key, defaultValue]);

  return value;
}
