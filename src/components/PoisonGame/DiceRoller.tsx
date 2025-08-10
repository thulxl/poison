import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DiceRollerProps {
  onRoll: () => void;
  results: {player: number, system: number} | null;
  currentPlayer: 'player' | 'system' | null;
}

export default function DiceRoller({ onRoll, results, currentPlayer }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  
  const handleRoll = () => {
    setIsRolling(true);
    onRoll();
    
    // 2秒后停止动画效果
    setTimeout(() => {
      setIsRolling(false);
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8 justify-items-center">
        {/* 玩家骰子 */}
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium mb-2">玩家</div>
          <motion.div
            className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800"
            animate={isRolling && results ? { 
              rotate: [0, 360, 0],
              scale: [1, 1.2, 1]
            } : {}}
            transition={isRolling ? {
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: 2
            } : {}}
          >
            {results ? results.player : <i className="fa-solid fa-dice"></i>}
          </motion.div>
        </div>
        
        {/* 系统骰子 */}
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium mb-2">系统</div>
          <motion.div
            className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700"
            animate={isRolling && results ? { 
              rotate: [0, -360, 0],
              scale: [1, 1.2, 1]
            } : {}}
            transition={isRolling ? {
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: 2,
              delay: 0.2
            } : {}}
          >
            {results ? results.system : <i className="fa-solid fa-dice"></i>}
          </motion.div>
        </div>
      </div>
      
      {!results ? (
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className={cn(
            "px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto",
            isRolling 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          <i className="fa-solid fa-dice"></i>
          <span>掷骰子</span>
        </button>
      ) : (
        <div className="text-center">
          {currentPlayer ? (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 mb-4">
              {currentPlayer === 'player' 
                ? '你获得了先手！' 
                : '系统获得了先手！'}
            </div>
          ) : (
            <div className="text-amber-600 dark:text-amber-400 mb-4">
              平局！重新掷骰子...
            </div>
          )}
        </div>
      )}
    </div>
  );
}