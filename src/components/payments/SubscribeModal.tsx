'use client';

import { Loader2, CreditCard, Wallet } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  planType: string;
  months: number;
  basePrice: number;
  discount: number;
  finalPrice: number;
}

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  plans: Plan[];
  // eslint-disable-next-line no-unused-vars
  onSubscribe: (_planType: string, _paymentSource: 'wallet' | 'card') => Promise<void>;
}

export function SubscribeModal({
  isOpen,
  onClose,
  creator,
  plans,
  onSubscribe,
}: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [paymentSource, setPaymentSource] = useState<'card' | 'wallet'>('card');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      await onSubscribe(selectedPlan, paymentSource);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanLabel = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'Monthly';
      case 'threemonth':
        return '3 Months';
      case 'sixmonth':
        return '6 Months';
      case 'twelvemonth':
        return '12 Months';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to {creator.displayName}</DialogTitle>
          <DialogDescription>
            Choose a subscription plan to unlock exclusive content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Select Plan</h4>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid gap-2">
              {plans.map((plan) => (
                <div
                  key={plan.planType}
                  className="flex items-center justify-between space-x-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={plan.planType} id={plan.planType} />
                    <Label htmlFor={plan.planType} className="flex flex-col">
                      <span>{getPlanLabel(plan.planType)}</span>
                      {plan.discount > 0 && (
                        <span className="text-xs font-medium text-green-600">
                          Save {Math.round(plan.discount * 100)}%
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="font-bold">{formatCurrency(plan.finalPrice)}</div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium leading-none">Payment Method</h4>
            <RadioGroup
              value={paymentSource}
              onValueChange={(v) => setPaymentSource(v as 'card' | 'wallet')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="bg-popover flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Card
                </Label>
              </div>
              <div>
                <RadioGroupItem value="wallet" id="wallet" className="peer sr-only" />
                <Label
                  htmlFor="wallet"
                  className="bg-popover flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  Wallet
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
