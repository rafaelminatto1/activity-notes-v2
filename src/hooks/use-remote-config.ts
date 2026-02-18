"use client";

import { useEffect, useState } from "react";
import { remoteConfig } from "@/lib/firebase/config";
import { fetchAndActivate, getValue } from "firebase/remote-config";

type RemoteConfigScalar = string | number | boolean;

export function useRemoteConfig<T extends RemoteConfigScalar>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (!remoteConfig) return;

    const fetchConfig = async () => {
      try {
        if (!remoteConfig) return;
        await fetchAndActivate(remoteConfig);
        const val = getValue(remoteConfig, key);
        if (typeof defaultValue === 'boolean') {
            setValue(val.asBoolean() as T);
        } else if (typeof defaultValue === 'number') {
            setValue(val.asNumber() as T);
        } else {
            setValue(val.asString() as T);
        }
      } catch (error) {
        console.error("Remote Config fetch failed", error);
      }
    };

    fetchConfig();
  }, [key, defaultValue]);

  return value;
}
