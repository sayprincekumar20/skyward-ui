import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FlightCard from '@/components/FlightCard';
import { Flight, flightsAPI } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAIWidget } from '@/hooks/useAIWidget';
import { AIWidgetRenderer } from '@/components/AIWidgetRenderer';

const Flights = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { widgetConfig, dismissWidget, handleCTAAction } = useAIWidget('flight_selection');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const onWidgetAction = (action: string) => {
    handleCTAAction(action);
    if (action === 'show_cheapest') {
      const sorted = [...flights].sort((a, b) => a.price - b.price);
      setFlights(sorted);
    } else if (action === 'price_alert') {
      toast({
        title: "Price Alert Set",
        description: "We'll notify you when prices drop!",
      });
    }
  };

  useEffect(() => {
    const searchFlights = async () => {
      const token = authStorage.getToken();
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to search flights',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        const searchData = {
          origin: searchParams.get('origin') || '',
          destination: searchParams.get('destination') || '',
          departure_date: searchParams.get('departure_date') || '',
          return_date: searchParams.get('return_date') || undefined,
          passengers: parseInt(searchParams.get('passengers') || '1'),
          cabin_class: (searchParams.get('cabin_class') || 'economy') as any,
          trip_type: (searchParams.get('trip_type') || 'one_way') as any,
        };

        const results = await flightsAPI.search(searchData, token);
        setFlights(results);
        
        if (results.length === 0) {
          toast({
            title: 'No flights found',
            description: 'Try adjusting your search criteria',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Search failed',
          description: error.response?.data?.detail || 'Unable to search flights',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    searchFlights();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* AI Widget */}
      <AIWidgetRenderer
        widgetConfig={widgetConfig}
        onDismiss={dismissWidget}
        onCTAClick={onWidgetAction}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Available Flights
          </h1>
          <p className="text-muted-foreground">
            {searchParams.get('origin')} → {searchParams.get('destination')} • {searchParams.get('departure_date')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Flights;
