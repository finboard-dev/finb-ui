"use client";

import React from "react";

export default function GoogleSheet({ sheetId }: { sheetId?: string }) {
  return (
    <div className="w-full h-full overflow-hidden rounded-md border border-gray-200">
      <iframe
        src={sheetId}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Google Sheet"
      />
    </div>
  );
}
