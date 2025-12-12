import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { checkinAPI, CheckinFindResponse, SeatInfo } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Plane, User, Armchair, Target, Check, Loader2, Sparkles, X } from 'lucide-react';

const CheckIn = () => {
  const { toast } = useToast();
  const [pnr, setPnr] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectingSeats, setSelectingSeats] = useState(false);
  const [checkinData, setCheckinData] = useState<CheckinFindResponse | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);

  const handleFindBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      toast({ title: 'Please login first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const data = await checkinAPI.find({ pnr, email }, token);
      setCheckinData(data);
      toast({ title: 'Booking found!', description: `PNR: ${data.booking.pnr}` });
      
      // Show AI recommendation popup if agent_response has a valid recommended_seat
      if (data.agent_response?.response?.recommended_seat) {
        setShowRecommendationPopup(true);
      }
    } catch (error: any) {
      toast({ 
        title: 'Booking not found', 
        description: error.response?.data?.detail || 'Please check your PNR and email',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = async (seatId: string) => {
    if (!checkinData) return;
    const token = getAuthToken();
    if (!token) return;

    setSelectingSeats(true);
    setSelectedSeat(seatId);
    try {
      const result = await checkinAPI.selectSeat({
        pnr: checkinData.booking.pnr,
        flight_id: checkinData.booking.flight_id,
        seat_id: seatId,
      }, token);
      
      toast({ title: 'Seat selected!', description: result.message });
      // Refresh data
      const updatedData = await checkinAPI.find({ pnr, email }, token);
      setCheckinData(updatedData);
    } catch (error: any) {
      toast({ 
        title: 'Failed to select seat', 
        description: error.response?.data?.detail || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setSelectingSeats(false);
    }
  };

  const renderSeatMap = (seats: SeatInfo[]) => {
    const rows = [...new Set(seats.map(s => s.row))].sort((a, b) => a - b);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted border border-border"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary border border-primary"></div>
            <span>Selected</span>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-1">
          {rows.map(row => {
            const rowSeats = seats.filter(s => s.row === row);
            return (
              <div key={row} className="flex items-center justify-center gap-1">
                <span className="w-8 text-xs text-muted-foreground">{row}</span>
                {rowSeats.map(seat => (
                  <button
                    key={seat.seat_id}
                    disabled={seat.booked || selectingSeats}
                    onClick={() => handleSeatSelect(seat.seat_id)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      seat.booked 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : checkinData?.booking.selected_seats?.includes(seat.seat_id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/20 hover:bg-primary/40 text-foreground cursor-pointer'
                    }`}
                  >
                    {seat.letter}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgentRecommendation = () => {
    if (!checkinData) return null;
    
    const { agent_response, booking, seat_map } = checkinData;
    const analytics = booking.analytics_booking_details?.[0];
    
    // If there's an error, use analytics data to create recommendation
    const hasError = agent_response.error;
    
    // Derive recommendation from analytics
    const preferredSeatType = analytics ? (analytics.WINDOW > analytics.AISLE ? 'Window' : 'Aisle') : 'Window';
    const preferredOrigin = analytics?.PREFERREDORIGIN || 'N/A';
    const preferredDest = analytics?.PREFERREDDESTINATION || 'N/A';
    
    // Find a recommended available seat
    const availableSeats = seat_map.filter(s => !s.booked);
    const recommendedSeat = availableSeats.find(s => 
      s.seat_type.toLowerCase() === preferredSeatType.toLowerCase()
    ) || availableSeats[0];

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-xl font-bold">
            Upgrade your seat, powered by AI
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-lg mb-3">Your Recommended Upgrade (Smart-Selected)</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <span>Upgrade Recommended: <strong>{preferredOrigin} → {preferredDest}</strong></span>
              </div>
              
              <div className="flex items-center gap-2">
                <Armchair className="h-5 w-5 text-muted-foreground" />
                <span>Your best seat: <strong>{recommendedSeat?.seat_id || 'N/A'} ({preferredSeatType}, Extra Legroom)</strong></span>
              </div>
              
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-destructive" />
                <span>Matched to your preference based on previous trips</span>
              </div>
            </div>
            
            <p className="text-primary font-medium mt-3">
              Only {availableSeats.filter(s => s.seat_type === 'window').length} stretch seats left
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <h5 className="font-semibold">Price Today</h5>
            <p className="text-3xl font-bold">₹{analytics?.TOTALSPEND ? Math.round(analytics.TOTALSPEND / 20) : 3200}</p>
            <p className="text-sm text-muted-foreground">High comfort score for this flight</p>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 font-semibold mb-2">
              <Check className="h-5 w-5 text-primary" />
              <span>Included in Auto-Selection</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• Seat {recommendedSeat?.seat_id || 'N/A'} pre-assigned for you</li>
              <li>• You can change seat → <button 
                onClick={() => document.getElementById('seat-map')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary hover:underline"
              >Change seat</button></li>
            </ul>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => recommendedSeat && handleSeatSelect(recommendedSeat.seat_id)}
            disabled={!recommendedSeat || selectingSeats}
          >
            {selectingSeats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendationPopup = () => {
    if (!checkinData?.agent_response?.response?.recommended_seat) return null;
    
    const { recommended_seat } = checkinData.agent_response.response;
    
    return (
      <Dialog open={showRecommendationPopup} onOpenChange={setShowRecommendationPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Seat Recommendation
            </DialogTitle>
            <DialogDescription>
              Based on your preferences, we've found the perfect seat for you
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Recommended Seat</p>
              <p className="text-4xl font-bold text-primary">{recommended_seat.seat_id}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {recommended_seat.seat_type}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  Row {recommended_seat.row}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {recommended_seat.cabin_class}
                </Badge>
              </div>
            </div>
            
            {recommended_seat.features && recommended_seat.features.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {recommended_seat.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {recommended_seat.price_upgrade && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Upgrade Price</span>
                <span className="text-lg font-semibold">₹{recommended_seat.price_upgrade}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRecommendationPopup(false)}
            >
              Choose Later
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                handleSeatSelect(recommended_seat.seat_id);
                setShowRecommendationPopup(false);
              }}
            >
              Select This Seat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* AI Recommendation Popup */}
      {renderRecommendationPopup()}
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Web Check-In</h1>
        
        {!checkinData ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Find Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFindBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pnr">PNR Number</Label>
                  <Input 
                    id="pnr" 
                    value={pnr} 
                    onChange={(e) => setPnr(e.target.value.toUpperCase())}
                    placeholder="Enter your PNR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || (!pnr && !email)}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Web Check-in
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Booking Info & Seat Map */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Booking Details</CardTitle>
                    <Badge variant={checkinData.booking.checked_in ? 'default' : 'secondary'}>
                      {checkinData.booking.checked_in ? 'Checked In' : 'Not Checked In'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">PNR</p>
                      <p className="font-semibold">{checkinData.booking.pnr}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold capitalize">{checkinData.booking.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Passengers</p>
                      <p className="font-semibold">{checkinData.booking.passengers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fare</p>
                      <p className="font-semibold">₹{checkinData.booking.total_fare}</p>
                    </div>
                    {checkinData.booking.selected_seats && checkinData.booking.selected_seats.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Selected Seats</p>
                        <p className="font-semibold">{checkinData.booking.selected_seats.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>Passenger Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold">{checkinData.user_info.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{checkinData.user_info.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold">{checkinData.user_info.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loyalty Tier</p>
                      <p className="font-semibold capitalize">{checkinData.user_info.loyalty_tier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="seat-map">
                <CardHeader>
                  <CardTitle>Select Your Seat</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSeatMap(checkinData.seat_map)}
                </CardContent>
              </Card>
            </div>

            {/* Right: AI Recommendation */}
            <div>
              {renderAgentRecommendation()}
              
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => {
                  setCheckinData(null);
                  setPnr('');
                  setEmail('');
                }}
              >
                Check Another Booking
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CheckIn;