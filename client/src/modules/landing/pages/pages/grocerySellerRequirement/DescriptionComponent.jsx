import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DescriptionComponent = ({ req }) => {
  // 1. Check if text exceeds 50 characters
  const limit = 50;
  const isLongText = req?.description && req.description.length > limit;

  // 2. Create the "preview" text
  const displayText = isLongText
    ? req.description.slice(0, limit) + "..."
    : req.description;

  return (
    <div className="text-sm">
      <span className="font-semibold text-gray-900">Supplier Description: </span>

      {/* Render the sliced text directly. No 'line-clamp' needed. */}
      <span className="text-gray-700">
        {displayText}
      </span>

      {/* Show 'Read More' if text was sliced */}
      {isLongText && (
        <Dialog>
          <DialogTrigger asChild>
            <span className="text-blue-600 text-xs font-bold cursor-pointer hover:underline ml-1">
              Read More
            </span>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Supplier Description</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Full details provided by the supplier.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed text-gray-700">
              {req.description}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DescriptionComponent;
