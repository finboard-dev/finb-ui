"use client";

import { useCallback } from "react";

type MentionData = {
  id: string;
  name: string;
  command: string;
  icon: string;
};

export function useMentionParser() {
  // Parse HTML content to extract mentions
  const parseMentionsFromHTML = useCallback(
    (htmlContent: string): MentionData[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const mentionElements = doc.querySelectorAll("[data-mention-id]");

      const mentions: MentionData[] = [];

      mentionElements.forEach((element) => {
        const id = element.getAttribute("data-mention-id") || "";
        const name = element.textContent?.replace("@", "") || "";
        const iconElement = element.querySelector("span");
        const icon = iconElement?.textContent || "";

        // You would need to map back to the original command
        // This is a simplified example
        const command = `generate a ${name.toLowerCase()} report`;

        mentions.push({ id, name, command, icon });
      });

      return mentions;
    },
    []
  );

  // Convert HTML with mentions to plain text
  const convertToPlainText = useCallback((htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Replace mention elements with their text representation
    const mentionElements = doc.querySelectorAll("[data-mention-id]");
    mentionElements.forEach((element) => {
      const textNode = doc.createTextNode(
        `@${element.textContent?.replace("@", "")}`
      );
      element.parentNode?.replaceChild(textNode, element);
    });

    return doc.body.textContent || "";
  }, []);

  return {
    parseMentionsFromHTML,
    convertToPlainText,
  };
}
