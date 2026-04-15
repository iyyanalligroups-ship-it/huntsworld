import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ConfirmDeleteDialog = ({ open, onClose, onConfirm, name }) => {
    console.log(name,"name");
    
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          {name && (
            <DialogDescription className="text-muted-foreground mt-2">
              Do you really want to delete <span className="font-semibold text-destructive">{name}</span>?
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="cursor-pointer"  onClick={onConfirm}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
