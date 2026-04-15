import React, { useState } from 'react';
import TreandingPointForm from './PointForm';
import TreandingPointList from './PointList';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';


const Point = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [open, setOpen] = useState(false);

  const handleEdit = (point) => {
    setSelectedPoint(point);
    setOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPoint(null);
    setOpen(true);
  };

  return (
    <div className="p-1 sm:p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Trending Points Section */}
        <div className="flex-1 space-y-6  p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Trending Points</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="flex gap-2 items-center">
                  <PlusCircle className="w-4 h-4" /> Add Point
                </Button>
              </DialogTrigger>
              <DialogContent>
                <TreandingPointForm selectedPoint={selectedPoint} onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <TreandingPointList onEdit={handleEdit} />
        </div>

     
      </div>
    </div>

  );
};

export default Point;
