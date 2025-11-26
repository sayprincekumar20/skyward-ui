import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, MapPin, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAIWidget } from '@/hooks/useAIWidget';
import { AIWidgetRenderer } from '@/components/AIWidgetRenderer';

const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { widgetConfig, dismissWidget, handleCTAAction } = useAIWidget('search');
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    departure_date: '',
    return_date: '',
    passengers: '1',
    cabin_class: 'economy' as 'economy' | 'business' | 'first',
    trip_type: 'one_way' as 'one_way' | 'round_trip',
  });

  const onWidgetAction = (action: string) => {
    handleCTAAction(action);
    if (action === 'manage_existing') {
      navigate('/bookings');
    } else if (action === 'continue_search') {
      dismissWidget();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.origin || !searchData.destination || !searchData.departure_date) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to results page with search params
    const params = new URLSearchParams({
      origin: searchData.origin,
      destination: searchData.destination,
      departure_date: searchData.departure_date,
      passengers: searchData.passengers,
      cabin_class: searchData.cabin_class,
      trip_type: searchData.trip_type,
      ...(searchData.return_date && { return_date: searchData.return_date }),
    });
    
    navigate(`/flights?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Navbar />
      
      {/* AI Widget */}
      <AIWidgetRenderer
        widgetConfig={widgetConfig}
        onDismiss={dismissWidget}
        onCTAClick={onWidgetAction}
      />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Your Journey Begins Here
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Search flights to destinations worldwide and book with confidence
            </p>
          </div>

          {/* Search Form */}
          <Card className="p-8 shadow-card-hover">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Trip Type */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={searchData.trip_type === 'one_way' ? 'default' : 'outline'}
                  onClick={() => setSearchData({ ...searchData, trip_type: 'one_way' })}
                >
                  One Way
                </Button>
                <Button
                  type="button"
                  variant={searchData.trip_type === 'round_trip' ? 'default' : 'outline'}
                  onClick={() => setSearchData({ ...searchData, trip_type: 'round_trip' })}
                >
                  Round Trip
                </Button>
              </div>

              {/* Origin & Destination */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    From
                  </Label>
                  <Input
                    id="origin"
                    placeholder="e.g., JFK, New York"
                    value={searchData.origin}
                    onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    To
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., LAX, Los Angeles"
                    value={searchData.destination}
                    onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="departure_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Departure
                  </Label>
                  <Input
                    id="departure_date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={searchData.departure_date}
                    onChange={(e) => setSearchData({ ...searchData, departure_date: e.target.value })}
                    required
                  />
                </div>
                {searchData.trip_type === 'round_trip' && (
                  <div className="space-y-2">
                    <Label htmlFor="return_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Return
                    </Label>
                    <Input
                      id="return_date"
                      type="date"
                      min={searchData.departure_date || new Date().toISOString().split('T')[0]}
                      value={searchData.return_date}
                      onChange={(e) => setSearchData({ ...searchData, return_date: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Passengers & Cabin Class */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passengers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Passengers
                  </Label>
                  <Select
                    value={searchData.passengers}
                    onValueChange={(value) => setSearchData({ ...searchData, passengers: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Passenger' : 'Passengers'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabin_class">Cabin Class</Label>
                  <Select
                    value={searchData.cabin_class}
                    onValueChange={(value: any) => setSearchData({ ...searchData, cabin_class: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg gap-2">
                <SearchIcon className="h-5 w-5" />
                Search Flights
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Search;
