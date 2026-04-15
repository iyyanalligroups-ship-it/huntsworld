import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, HardHat, Hammer } from "lucide-react";

const StoriesButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* 1. The Attractive Trigger Button */}
      <DialogTrigger asChild>
        <Button
          className="
            relative overflow-hidden group cursor-pointer
            bg-gradient-to-r from-violet-500 to-fuchsia-500
            hover:from-violet-600 hover:to-fuchsia-600
            text-white font-bold rounded-full
            px-6  shadow-lg shadow-fuchsia-500/30
            transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-fuchsia-500/50
            flex items-center gap-2 border-0
          "
        >
          <BookOpen className="w-5 h-5 group-hover:animate-bounce" />
          <span className="tracking-wide">Stories</span>

          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        </Button>
      </DialogTrigger>

      {/* 2. The 'Coming Soon' Dialog Content */}
      <DialogContent className="sm:max-w-md text-center border-none shadow-2xl bg-gradient-to-b from-white to-slate-50 rounded-2xl p-8">
        <DialogHeader className="flex flex-col items-center gap-4">

          {/* Icon Container */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-violet-100 mb-2">
            <HardHat className="w-5 h-5 text-violet-600" />
            <Hammer className="w-6 h-6 text-fuchsia-500 absolute bottom-2 right-2 drop-shadow-sm" />
          </div>

          <DialogTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            Stories are Brewing! <Sparkles className="w-5 h-5 text-amber-400" />
          </DialogTitle>

          <DialogDescription className="text-slate-500 text-base mt-2">
            We are working hard behind the scenes to bring you an amazing new Stories experience. Grab a coffee and check back soon!
          </DialogDescription>
        </DialogHeader>

        {/* Action Button (Optional to close dialog) */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="rounded-full px-8 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>

      {/* Tailwind custom animation for the button shine */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `
      }} />
    </Dialog>
  );
};

export default StoriesButton;
