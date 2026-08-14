"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeResume, uploadResume } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export function ResumeManager({
  resume,
}: {
  resume: {
    storageKey: string;
    fileName: string;
    sizeBytes: number;
    uploadedAt: Date | string;
  } | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <div>
      <h2 className="font-display text-xl">Resume</h2>
      <p className="mt-1 text-xs text-ash">
        PDF, DOC, or DOCX. Only you, and people you share it with in chat, can open it.
      </p>

      {resume ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-smoke/30 bg-parchment/60 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember-deep">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={`/api/files/${resume.storageKey}`}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-semibold text-coal hover:text-ember"
            >
              {resume.fileName}
            </a>
            <p className="text-xs text-ash">
              {Math.max(1, Math.round(resume.sizeBytes / 1024))} KB · uploaded{" "}
              {format(new Date(resume.uploadedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-smoke/40 px-3 py-4 text-sm text-ash">
          No resume on your profile yet.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={resume ? "secondary" : "primary"}
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Working…" : resume ? "Replace resume" : "Upload resume"}
        </Button>
        {resume ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await removeResume();
                if (!res.ok) setError(res.error);
                else {
                  setError(undefined);
                  router.refresh();
                }
              })
            }
          >
            Delete
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const fd = new FormData();
          fd.set("resume", file);
          start(async () => {
            const res = await uploadResume(fd);
            if (!res.ok) setError(res.error);
            else {
              setError(undefined);
              router.refresh();
            }
          });
        }}
      />
    </div>
  );
}
