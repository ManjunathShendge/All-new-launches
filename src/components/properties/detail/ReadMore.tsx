"use client";

import { useState } from "react";

export default function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > 320;

  return (
    <div>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-muted ${
          !open && isLong ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-sm font-semibold text-[#2563EB] hover:underline"
        >
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
