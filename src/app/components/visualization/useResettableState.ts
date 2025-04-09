// visualizations/useResettableState.ts
import { useState, useEffect } from 'react';

export default function useResettableState<T>(
  initialValue: () => T,
  resetTriggers: any[]
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    setValue(initialValue());
  }, resetTriggers);

  return [value, setValue];
}