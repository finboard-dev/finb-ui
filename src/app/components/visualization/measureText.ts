// visualizations/measureText.ts
export function measureText(
  text: string,
  fontSize: number,
  fontWeight: string,
  fontFamily: string
): { width: number; height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(text);
  return { width: metrics.width, height: fontSize * 1.2 }; // Approximate height
}

export function findMaxFontSize(
  text: string,
  maxHeight: number,
  maxWidth: number,
  fontWeight: string,
  fontFamily: string
): number {
  let fontSize = 8; // Minimum size
  while (true) {
    const { width, height } = measureText(text, fontSize, fontWeight, fontFamily);
    if (width > maxWidth || height > maxHeight) {
      return fontSize - 1;
    }
    fontSize++;
  }
}