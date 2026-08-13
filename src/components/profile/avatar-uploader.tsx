"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeAvatar, uploadAvatar } from "@/actions/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export function AvatarUploader({
  name,
  image,
  size = "xl",
}: {
  name: string;
  image?: string | null;
  size?: "lg" | "xl";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [current, setCurrent] = useState(image ?? null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload profile photo"
        disabled={pending}
      >
        <Avatar name={name} image={preview ?? current} size={size} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-ember text-warm-white shadow-sm ring-2 ring-warm-white">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>
      <div className="min-w-0">
        <p className="font-semibold text-coal">Profile photo</p>
        <p className="text-xs text-ash">JPG, PNG, or WebP · max 2MB</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Uploading…" : current ? "Change photo" : "Upload photo"}
          </Button>
          {current ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await removeAvatar();
                  if (!res.ok) setError(res.error);
                  else {
                    setPreview(null);
                    setCurrent(null);
                    setError(undefined);
                    router.refresh();
                  }
                })
              }
            >
              Remove
            </Button>
          ) : null}
        </div>
        {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const url = URL.createObjectURL(file);
          setPreview(url);
          const fd = new FormData();
          fd.set("avatar", file);
          start(async () => {
            const res = await uploadAvatar(fd);
            if (!res.ok) {
              setError(res.error);
              setPreview(null);
            } else {
              setCurrent(url);
              setError(undefined);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}
