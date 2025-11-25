import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, Ancillary, flightsAPI, bookingsAPI } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { Plane, Clock, Calendar, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [ancillaries, setAncillaries] = useState<Ancillary[]>([]);
  const [selectedAncillaries, setSelectedAncillaries] = useState<number[]>([]);
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'wallet'>('credit_card');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const loadFlightDetails = async () => {
      const token = authStorage.getToken();
      if (!token || !id) return;

      setIsLoading(true);
      try {
        const [flightData, ancillariesData] = await Promise.all([
          flightsAPI.getById(parseInt(id), token),
          flightsAPI.getAncillaries(token),
        ]);
        setFlight(flightData);
        setAncillaries(ancillariesData);
      } catch (error: any) {
        toast({
          title: 'Failed to load flight details',
          description: error.response?.data?.detail || 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFlightDetails();
  }, [id]);

  const toggleAncillary = (ancillaryId: number) => {
    setSelectedAncillaries((prev) =>
      prev.includes(ancillaryId)
        ? prev.filter((id) => id !== ancillaryId)
        : [...prev, ancillaryId]
    );
  };

  const calculateTotal = () => {
    if (!flight) return 0;
    const flightTotal = flight.price * passengers;
    const ancillaryTotal = ancillaries
      .filter((a) => selectedAncillaries.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    return flightTotal + ancillaryTotal;
  };

  const handleBooking = async () => {
    const token = authStorage.getToken();
    if (!token || !flight) return;

    setIsBooking(true);
    try {
      const booking = await bookingsAPI.create(
        {
          flight_id: flight.id,
          passengers,
          total_fare: calculateTotal(),
          ancillary_items: selectedAncillaries,
          payment_method: paymentMethod,
        },
        token
      );

      toast({
        title: 'Booking confirmed!',
        description: `Your PNR is ${booking.pnr}`,
      });

      navigate('/bookings');
    } catch (error: any) {
      toast({
        title: 'Booking failed',
        description: error.response?.data?.detail || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Flight not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Flight Details</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">From</div>
                    <div className="text-2xl font-bold">{flight.origin}</div>
                  </div>
                  <Plane className="h-6 w-6 text-primary" />
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">To</div>
                    <div className="text-2xl font-bold">{flight.destination}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Departure</div>
                      <div className="font-medium">
                        {new Date(flight.departure_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Arrival</div>
                      <div className="font-medium">
                        {new Date(flight.arrival_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{flight.duration} minutes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Available Seats</div>
                      <div className="font-medium">{flight.available_seats}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Airline:</span>
                      <span className="ml-2 font-medium">{flight.airline}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Flight:</span>
                      <span className="ml-2 font-medium">{flight.flight_number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <span className="ml-2 font-medium capitalize">{flight.cabin_class}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Ancillaries */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Add-ons</h3>
              <div className="space-y-3">
                {ancillaries.map((ancillary) => (
                  <div
                    key={ancillary.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedAncillaries.includes(ancillary.id)}
                      onCheckedChange={() => toggleAncillary(ancillary.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{ancillary.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ancillary.description}
                      </div>
                    </div>
                    <div className="font-bold">${ancillary.price}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="p-6 sticky top-20">
              <h3 className="text-xl font-bold mb-6">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="passengers">Number of Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max={flight.available_seats}
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="payment">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: any) => setPaymentMethod(value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pb-4 mb-4 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Flight ({passengers} × ${flight.price})</span>
                  <span>${flight.price * passengers}</span>
                </div>
                {selectedAncillaries.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Add-ons</span>
                    <span>
                      $
                      {ancillaries
                        .filter((a) => selectedAncillaries.includes(a.id))
                        .reduce((sum, a) => sum + a.price, 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-bold text-primary">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>

              <Button
                onClick={handleBooking}
                disabled={isBooking}
                className="w-full h-12"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlightDetail;
