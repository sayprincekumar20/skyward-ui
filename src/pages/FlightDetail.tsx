import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flight, Ancillary, PaymentOffer, flightsAPI, bookingsAPI } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { Plane, Clock, Calendar, Users, Loader2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentGatewayWithAI from '@/components/PaymentGatewayWithAI';
import { useAIWidget } from '@/hooks/useAIWidget';
import { AIWidgetRenderer } from '@/components/AIWidgetRenderer';

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { widgetConfig, dismissWidget, handleCTAAction } = useAIWidget('addons');
  const [flight, setFlight] = useState<Flight | null>(null);
  const [ancillaries, setAncillaries] = useState<Ancillary[]>([]);
  const [selectedAncillaries, setSelectedAncillaries] = useState<number[]>([]);
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'wallet'>('credit_card');
  const [paymentOffers, setPaymentOffers] = useState<PaymentOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const onWidgetAction = (action: string) => {
    handleCTAAction(action);
    if (action === 'apply_bundle') {
      const bundleIds = ancillaries.slice(0, 3).map(a => a.id);
      setSelectedAncillaries(bundleIds);
      toast({
        title: "Bundle Applied",
        description: "Recommended add-ons have been selected for you!",
      });
    } else if (action === 'skip_addons') {
      setShowPayment(true);
    }
  };

  useEffect(() => {
    const loadFlightDetails = async () => {
      const token = authStorage.getToken();
      if (!token || !id) return;

      setIsLoading(true);
      try {
        const [flightData, ancillariesData, offersData] = await Promise.all([
          flightsAPI.getById(parseInt(id), token),
          flightsAPI.getAncillaries(token),
          flightsAPI.getPaymentOffers(token),
        ]);
        setFlight(flightData);
        setAncillaries(ancillariesData);
        setPaymentOffers(offersData);
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
    const subtotal = flightTotal + ancillaryTotal;
    
    // Apply discount if offer selected
    if (selectedOffer) {
      const offer = paymentOffers.find(o => o.id === selectedOffer);
      if (offer) {
        if (offer.discount_type === 'percentage') {
          return subtotal - (subtotal * offer.discount_value / 100);
        } else if (offer.discount_type === 'fixed') {
          return subtotal - offer.discount_value;
        }
      }
    }
    
    return subtotal;
  };

  const handleProceedToPayment = () => {
    setShowPayment(true);
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
        title: 'Payment successful!',
        description: `Your booking is confirmed. PNR: ${booking.pnr}`,
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
      
      {/* AI Widget for Add-ons Page */}
      {!showPayment && (
        <AIWidgetRenderer
          widgetConfig={widgetConfig}
          onDismiss={dismissWidget}
          onCTAClick={onWidgetAction}
        />
      )}
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Flight not found</p>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <PaymentGatewayWithAI
        total={calculateTotal()}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onConfirmPayment={handleBooking}
        onBack={() => setShowPayment(false)}
        isProcessing={isBooking}
      />
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

            {/* Payment Offers */}
            {paymentOffers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Payment Offers
                </h3>
                <div className="space-y-3">
                  {paymentOffers
                    .filter(offer => offer.payment_methods.includes(paymentMethod))
                    .map((offer) => (
                      <div
                        key={offer.id}
                        onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedOffer === offer.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-lg">{offer.name}</div>
                          <div className="text-primary font-bold">
                            {offer.discount_type === 'percentage' 
                              ? `${offer.discount_value}% OFF`
                              : `$${offer.discount_value} OFF`
                            }
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Valid for: {offer.payment_methods.join(', ').replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  {paymentOffers.filter(offer => offer.payment_methods.includes(paymentMethod)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No offers available for selected payment method
                    </p>
                  )}
                </div>
              </Card>
            )}
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
                {selectedOffer && (
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span>Discount Applied</span>
                    <span>
                      -$
                      {(() => {
                        const offer = paymentOffers.find(o => o.id === selectedOffer);
                        const subtotal = (flight.price * passengers) + 
                          ancillaries.filter((a) => selectedAncillaries.includes(a.id))
                            .reduce((sum, a) => sum + a.price, 0);
                        if (offer?.discount_type === 'percentage') {
                          return (subtotal * offer.discount_value / 100).toFixed(2);
                        }
                        return offer?.discount_value || 0;
                      })()}
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
                onClick={handleProceedToPayment}
                className="w-full h-12"
              >
                Proceed to Payment
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlightDetail;
