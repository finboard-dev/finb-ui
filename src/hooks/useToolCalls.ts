import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { 
  addToolCallResponse, 
  setActiveToolCallId,
  ToolCallResponse
} from '@/lib/store/slices/responsePanelSlice';
import { 
  setResponsePanelWidth,
  openResponsePanel 
} from '@/lib/store/slices/chatSlice';
import { v4 as uuidv4 } from 'uuid';

export const useToolCalls = () => {
  const dispatch = useAppDispatch();
  const { toolCallResponses, activeToolCallId } = useAppSelector(state => state.responsePanel);
  const { responsePanelWidth } = useAppSelector(state => state.chat);

  // Find a tool call response by ID or name
  const findToolCallResponse = useCallback((idOrName: string) => {
    // First try to find by exact ID match
    let response = toolCallResponses.find(res => res.tool_call_id === idOrName);
    
    // If not found by ID, try to find by tool name
    if (!response) {
      response = toolCallResponses.find(res => 
        res.tool_name.toLowerCase() === idOrName.toLowerCase()
      );
    }
    
    return response;
  }, [toolCallResponses]);

  // Add a new tool call response
  const addNewToolCallResponse = useCallback((toolCall: Omit<ToolCallResponse, 'id'>) => {
    const response: ToolCallResponse = {
      ...toolCall,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    
    dispatch(addToolCallResponse(response));
    dispatch(setActiveToolCallId(response.tool_call_id));
    dispatch(openResponsePanel());
    
    return response;
  }, [dispatch]);

  // Activate a specific tool call tab
  const activateToolCall = useCallback((toolCallId: string) => {
    const response = findToolCallResponse(toolCallId);
    
    if (response) {
      dispatch(setActiveToolCallId(response.tool_call_id));
      
      // Only open the panel if it's currently closed
      if (responsePanelWidth === 0) {
        dispatch(openResponsePanel());
      }
      return true;
    }
    return false;
  }, [dispatch, findToolCallResponse, responsePanelWidth]);

  // Toggle the response panel visibility
  const toggleResponsePanel = useCallback(() => {
    if (responsePanelWidth === 0) {
      dispatch(openResponsePanel());
    } else {
      dispatch(setResponsePanelWidth(0));
    }
  }, [dispatch, responsePanelWidth]);

  return {
    toolCallResponses,
    activeToolCallId,
    findToolCallResponse,
    addNewToolCallResponse,
    activateToolCall,
    toggleResponsePanel,
    isPanelOpen: responsePanelWidth > 0
  };
};