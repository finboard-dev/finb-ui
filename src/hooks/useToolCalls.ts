// hooks/useToolCallSelection.ts
import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { setActiveToolCallId } from '@/lib/store/slices/responsePanelSlice';
import { setResponsePanelWidth } from '@/lib/store/slices/chatSlice';

export const useToolCallSelection = () => {
  const dispatch = useAppDispatch();

  /**
   * Selects a tool call and opens the response panel
   * @param toolCallId - The ID of the tool call to select
   * @param messageId - The ID of the message containing the tool call
   */
  const selectToolCall = useCallback(
    (toolCallId: string, messageId: string) => {
      // Set the active tool call ID in the store
      dispatch(setActiveToolCallId(toolCallId));
      
      // Open the response panel
      dispatch(setResponsePanelWidth(550));
      
      // Dispatch a custom event to notify other components
      const event = new CustomEvent('toolCallSelected', {
        detail: { toolCallId, messageId }
      });
      window.dispatchEvent(event);
    },
    [dispatch]
  );

  return { selectToolCall };
};

export default useToolCallSelection;