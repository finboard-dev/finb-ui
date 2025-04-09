"use client";

import React from "react";

export default function GoogleSheet({ sheetId }: { sheetId?: string }) {
  const embedUrl = `https://docs.google.com/spreadsheets/d/1ROjPpfTCf9ifn8QlzGXQZpM3FCL-lUJLcgao-YpcwPE/edit?gid=0#gid=0`;

  return (
    <div className="w-full h-full overflow-hidden rounded-md border border-gray-200">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Google Sheet"
      />
    </div>
  );
}
