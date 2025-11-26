import { useState, useEffect, useCallback } from 'react';
import { aiAPI, trackingAPI } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CTAAction {
  label: string;
  action: string;
}

interface WidgetConfig {
  component_type: 'popup' | 'banner' | 'sidepanel';
  title: string;
  body: string;
  cta_list: CTAAction[];
  priority: 'high' | 'medium' | 'low';
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: string;
}

export const useAIWidget = (currentPage: string) => {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAIWidget = useCallback(async () => {
    if (!currentPage) return;
    
    const token = getAuthToken();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Track page visit first
      await trackingAPI.trackPageVisit(currentPage, token);
      
      // Get AI widget for current page
      const widgetResponse = await aiAPI.getWidget(currentPage, token);
      
      // Parse the response if it's a string
      if (typeof widgetResponse === 'string') {
        try {
          const parsed = JSON.parse(widgetResponse);
          setWidgetConfig(parsed);
        } catch {
          // If not JSON, it might be a simple message - skip widget display
          console.log('No AI widget for this page');
          setWidgetConfig(null);
        }
      } else {
        setWidgetConfig(widgetResponse as WidgetConfig);
      }
    } catch (err: any) {
      console.error('Failed to fetch AI widget:', err);
      setError(err.message);
      setWidgetConfig(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const dismissWidget = useCallback(() => {
    setWidgetConfig(null);
  }, []);

  const handleCTAAction = useCallback((action: string) => {
    console.log('AI Widget CTA clicked:', action);
    
    // Show toast for action confirmation
    toast({
      title: "Action Received",
      description: `Processing: ${action}`,
    });
    
    // Dismiss widget after action
    dismissWidget();
    
    // Return action for parent component to handle
    return action;
  }, [dismissWidget, toast]);

  useEffect(() => {
    fetchAIWidget();
  }, [fetchAIWidget]);

  return {
    widgetConfig,
    loading,
    error,
    dismissWidget,
    handleCTAAction,
    refetch: fetchAIWidget
  };
};
