import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Loader2, Lock, ArrowLeft } from 'lucide-react';
import { useAIWidget } from '@/hooks/useAIWidget';
import { AIWidgetRenderer } from '@/components/AIWidgetRenderer';

interface PaymentGatewayProps {
  total: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'wallet';
  onPaymentMethodChange: (method: 'credit_card' | 'debit_card' | 'wallet') => void;
  onConfirmPayment: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const PaymentGatewayWithAI = ({
  total,
  paymentMethod,
  onPaymentMethodChange,
  onConfirmPayment,
  onBack,
  isProcessing,
}: PaymentGatewayProps) => {
  const { widgetConfig, dismissWidget, handleCTAAction } = useAIWidget('payment');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [walletId, setWalletId] = useState('');

  const onWidgetAction = (action: string) => {
    handleCTAAction(action);
    if (action === 'upi_offer' || action === 'wallet_offer') {
      onPaymentMethodChange('wallet');
    } else if (action === 'card_offer') {
      onPaymentMethodChange('credit_card');
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      {/* AI Widget for Payment Page */}
      <AIWidgetRenderer
        widgetConfig={widgetConfig}
        onDismiss={dismissWidget}
        onCTAClick={onWidgetAction}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to booking
          </Button>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Secure Payment</h2>
                <p className="text-sm text-muted-foreground">Your payment information is encrypted and secure</p>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
              <Label className="text-base mb-4 block">Select Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value: any) => onPaymentMethodChange(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit Card</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="debit_card" id="debit_card" />
                  <Label htmlFor="debit_card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <span>Debit Card</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-5 w-5" />
                    <span>Digital Wallet / UPI</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Form */}
            <div className="space-y-6 mb-8">
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'wallet' && (
                <div>
                  <Label htmlFor="walletId">UPI ID / Wallet Number</Label>
                  <Input
                    id="walletId"
                    placeholder="yourname@upi or wallet ID"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="border-t pt-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-3xl font-bold text-primary">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Confirm Payment Button */}
            <Button
              onClick={onConfirmPayment}
              disabled={isProcessing}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Pay ${total.toLocaleString()}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By confirming payment, you agree to our terms and conditions
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayWithAI;
