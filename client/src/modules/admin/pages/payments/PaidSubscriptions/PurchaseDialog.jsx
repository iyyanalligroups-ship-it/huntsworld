// Updated for buy confirmation

import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const PurchaseDialog = ({ open, onOpenChange, plan, onPurchase }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>Confirm Purchase</DialogHeader>
        {plan ? (
          <>
            <p>
              Are you sure you want to buy {plan.subscription_plan_id.plan_name} for ₹
              {plan.subscription_plan_id.price}?
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                className="bg-green-500 hover:bg-green-400 cursor-pointer"
                onClick={() => onPurchase(plan)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Purchase
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>No plan selected. Please select a plan to proceed.</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;