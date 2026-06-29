import { api } from "@/adapters/payloser-api";

export async function uploadGroupImageFile(file: File | null) {
  if (!file) {
    return null;
  }

  return api.uploadImage(file);
}

export function startKakaoLogin() {
  window.location.assign(api.getKakaoLoginUrl());
}
