import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

interface AIWidgetRendererProps {
  widgetConfig: WidgetConfig | null;
  onCTAClick?: (action: string) => void;
  onDismiss?: () => void;
}

export const AIWidgetRenderer = ({ 
  widgetConfig, 
  onCTAClick, 
  onDismiss 
}: AIWidgetRendererProps) => {
  if (!widgetConfig) return null;

  const { 
    component_type, 
    title, 
    body, 
    cta_list, 
    priority, 
    position = 'top',
    icon = '🤖'
  } = widgetConfig;

  const handleCTAClick = (action: string) => {
    onCTAClick?.(action);
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'border-primary bg-primary/5';
      case 'medium':
        return 'border-secondary bg-secondary/5';
      case 'low':
        return 'border-muted bg-muted/5';
      default:
        return 'border-border bg-background';
    }
  };

  const renderWidgetContent = () => (
    <Card className={`relative ${getPriorityStyles()} border-2 shadow-lg`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground leading-relaxed">{body}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {cta_list.map((cta, index) => (
            <Button
              key={index}
              variant={index === 0 ? 'default' : 'outline'}
              onClick={() => handleCTAClick(cta.action)}
              className="min-w-[120px]"
            >
              {cta.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );

  // Render based on component type
  switch (component_type) {
    case 'popup':
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-2xl animate-in zoom-in-95">
            {renderWidgetContent()}
          </div>
        </div>
      );
    
    case 'banner':
      return (
        <div 
          className={`fixed ${
            position === 'top' ? 'top-0' : 'bottom-0'
          } left-0 right-0 z-40 p-4 animate-in slide-in-from-${
            position === 'top' ? 'top' : 'bottom'
          }`}
        >
          <div className="container mx-auto max-w-6xl">
            {renderWidgetContent()}
          </div>
        </div>
      );
    
    case 'sidepanel':
      return (
        <div 
          className={`fixed ${
            position === 'right' ? 'right-0' : 'left-0'
          } top-1/4 z-40 w-full max-w-md p-4 animate-in slide-in-from-${
            position === 'right' ? 'right' : 'left'
          }`}
        >
          {renderWidgetContent()}
        </div>
      );
    
    default:
      return <div className="p-4">{renderWidgetContent()}</div>;
  }
};
