import { Flight } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plane, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FlightCardProps {
  flight: Flight;
}

const FlightCard = ({ flight }: FlightCardProps) => {
  const navigate = useNavigate();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 grid grid-cols-3 gap-6 items-center">
          {/* Departure */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              {flight.origin}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatTime(flight.departure_time)}
            </div>
          </div>

          {/* Flight Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border"></div>
              <Plane className="h-4 w-4 text-primary rotate-90" />
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(flight.duration)}
              </span>
              <span className="capitalize">{flight.cabin_class}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {flight.airline} • {flight.flight_number}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">
              {flight.destination}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatTime(flight.arrival_time)}
            </div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="text-right border-l border-border pl-6">
          <div className="text-sm text-muted-foreground mb-1">From</div>
          <div className="text-3xl font-bold text-primary mb-2">
            ${flight.price.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Users className="h-3 w-3" />
            <span>{flight.available_seats} seats left</span>
          </div>
          <Button 
            onClick={() => navigate(`/flight/${flight.id}`)}
            className="w-full group-hover:scale-105 transition-transform"
          >
            Select Flight
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FlightCard;
