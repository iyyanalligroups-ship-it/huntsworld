import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Shadcn/UI Skeleton

const PurchaseDialog = ({ open, onOpenChange, plan, onPurchase, isLoading }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              'Confirm Upgrade'
            )}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ) : plan ? (
          <>
            <p>
              Are you sure you want to upgrade to {plan.subscription_plan_id.plan_name} for ₹
              {(plan.subscription_plan_id.price / 100).toFixed(2)}?
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-400 cursor-pointer"
                onClick={() => onPurchase(plan)}
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Upgrade
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p>No plan selected. Please select a plan to proceed.</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} disabled={isLoading}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;