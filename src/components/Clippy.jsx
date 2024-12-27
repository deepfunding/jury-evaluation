import { useState, useEffect } from "react";
import Image from "next/image";
import { Paperclip } from "lucide-react";

const SpeechBubble = ({ onYes, onNo }) => (
  <div className="absolute bottom-full right-[20px] mb-2 bg-[#FFFEBD] border border-black rounded-lg p-4 shadow-lg min-w-[300px] max-w-[320px] transition-opacity duration-300">
    <div className="absolute bottom-[-9px] right-[20px]">
      {/* Black border triangle */}
      <div className="w-0 h-0 
        border-l-[9px] border-l-transparent 
        border-t-[9px] border-t-black
        border-r-[9px] border-r-transparent"
      />
      {/* Yellow triangle overlapping the border */}
      <div className="absolute top-[-1px] left-[1px] w-0 h-0 z-10
        border-l-[8px] border-l-transparent 
        border-t-[9px] border-t-[#FFFEBD]
        border-r-[8px] border-r-transparent"
      />
    </div>
    <p className="text-sm text-black mb-8 whitespace-normal">
      Would you like to see what others thought about this dependency?
    </p>
    <div className="flex justify-between">
      <button
        onClick={onYes}
        className="px-3 py-1 text-sm text-black rounded border border-black hover:bg-[#E6E5AA]/20 transition-all duration-200 hover:scale-105"
      >
        Yes
      </button>
      <button
        onClick={onNo}
        className="px-3 py-0.7 text-sm text-black rounded border border-black hover:bg-[#E6E5AA]/20 transition-all duration-200 hover:scale-105"
      >
        No
      </button>
    </div>
  </div>
);

const STATES = {
  INITIAL: 'INITIAL',
  MINIMIZED_AFTER_YES: 'MINIMIZED_AFTER_YES',
  MINIMIZED_AFTER_NO: 'MINIMIZED_AFTER_NO'
};

export function Clippy({ onTogglePreviousEvals, showPreviousEvals }) {
  const [state, setState] = useState(STATES.INITIAL);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isMinimizedVisible, setIsMinimizedVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => {
        setIsEntering(false);
        setTimeout(() => {
          setShowBubble(true);
        }, 300);
      }, 200);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleYes = () => {
    setIsMinimizing(true);
    setTimeout(() => {
      onTogglePreviousEvals();
      setState(STATES.MINIMIZED_AFTER_YES);
      setIsMinimizing(false);
      setIsMinimizedVisible(true);
    }, 200);
  };

  const handleNo = () => {
    setIsMinimizing(true);
    setTimeout(() => {
      setState(STATES.MINIMIZED_AFTER_NO);
      setIsMinimizing(false);
      setIsMinimizedVisible(true);
    }, 200);
  };

  const handleMinimizedClick = () => {
    if (state === STATES.MINIMIZED_AFTER_NO) {
      setIsMinimizedVisible(false);
      setTimeout(() => {
        setState(STATES.INITIAL);
      }, 200);
    }
  };

  if (!isVisible) {
    return null;
  }

  // Render minimized Clippy
  if (state === STATES.MINIMIZED_AFTER_YES || state === STATES.MINIMIZED_AFTER_NO) {
    return (
      <div className={`relative flex items-center transition-opacity duration-200 ${isMinimizedVisible ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={handleMinimizedClick}
          className={`relative group ${state === STATES.MINIMIZED_AFTER_YES ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={state === STATES.MINIMIZED_AFTER_YES}
        >
          <Paperclip 
            className={`w-6 h-6 transition-colors duration-200 rotate-45 
              ${state === STATES.MINIMIZED_AFTER_YES ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          />
          {state === STATES.MINIMIZED_AFTER_NO && (
            <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block text-sm text-gray-600 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
              Click to see Clippy again
            </span>
          )}
        </button>
      </div>
    );
  }

  // Render full Clippy with speech bubble
  return (
    <div className={`relative flex items-center transition-all duration-300 origin-bottom-right
      ${isMinimizing ? 'scale-[0.075] opacity-0' : 'scale-100 opacity-100'}
      ${isEntering ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
    `}>
      <div className="relative flex items-center group">
        {!showPreviousEvals && showBubble && (
          <SpeechBubble 
            onYes={handleYes} 
            onNo={handleNo}
          />
        )}
        <div className={`transition-transform duration-300 ${showPreviousEvals ? "rotate-[15deg] scale-110" : ""}`}>
          <Image
            src="/assets/clippy.png"
            alt="Clippy"
            width={80}
            height={80}
            className="animate-subtle-bounce"
          />
        </div>
      </div>
    </div>
  );
} 
