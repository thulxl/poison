import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Position {
  x: number;
  y: number;
}

interface GameBoardProps {
  size: number;
  onCellSelect: (position: Position) => void;
  selectedPositions: Position[];
  playerPoison: Position | null;
  systemPoison: Position | null;
  currentPlayer: 'player' | 'system';
  gameEnded?: boolean;
  isPlacingPoison?: boolean;
  startingPlayer: 'player' | 'system' | null;
}

export default function GameBoard({
  size,
  onCellSelect,
  selectedPositions,
  playerPoison,
  systemPoison,
  currentPlayer,
  gameEnded = false,
  isPlacingPoison = false,
  startingPlayer
}: GameBoardProps) {
  // 检查位置是否已经被选择
  const isSelected = (position: Position) => {
    return selectedPositions.some(p => p.x === position.x && p.y === position.y);
  };
  
  // 获取选中位置的玩家
  const getSelectedBy = (position: Position) => {
    const index = selectedPositions.findIndex(p => p.x === position.x && p.y === position.y);
    if (index === -1 || !startingPlayer) return null;
    // 根据先手玩家确定选择者
    return index % 2 === 0 ? startingPlayer : startingPlayer === 'player' ? 'system' : 'player';
  };
  
  // 创建网格单元格
  const renderCell = (x: number, y: number) => {
    const position = { x, y };
    const selected = isSelected(position);
    const selectedBy = getSelectedBy(position);
    const isPlayerPoison = playerPoison && position.x === playerPoison.x && position.y === playerPoison.y;
    const isSystemPoison = systemPoison && position.x === systemPoison.x && position.y === systemPoison.y;
  const isCurrentPlayerTurn = currentPlayer === 'player';
  
  // 确定单元格样式
  let cellClass = 'flex items-center justify-center aspect-square border border-gray-300 dark:border-gray-600 transition-all duration-200';
  
  // 毒药放置阶段样式
  if (isPlacingPoison) {
    cellClass += selected 
      ? ' bg-red-100 dark:bg-red-900/30 cursor-not-allowed' 
      : ' bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer';
  } else if (isPlayerPoison) {
    cellClass += ' bg-red-100 dark:bg-red-900/30';
  } else if (isSystemPoison) {
    cellClass += ' bg-purple-100 dark:bg-purple-900/30';
  } else if (selected) {
    cellClass += selectedBy === 'player' 
      ? ' bg-blue-100 dark:bg-blue-900/30' 
      : ' bg-gray-200 dark:bg-gray-700';
  } else {
    cellClass += ' bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer';
  }
    
  // 单元格内容
  let cellContent = null;
  
  // 毒药放置阶段内容
  if (isPlacingPoison) {
    if (selected) {
      cellContent = (
        <div className="text-red-600 dark:text-red-400 text-xl animate-pulse">
          <i className="fa-solid fa-skull"></i>
        </div>
      );
    } else {
      cellContent = (
        <div className="text-gray-300 dark:text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity">
          <i className="fa-solid fa-plus"></i>
        </div>
      );
    }
  } else if (isPlayerPoison) {
    cellContent = (
      <div className="text-red-600 dark:text-red-400 text-xl animate-pulse">
        <i className="fa-solid fa-skull"></i>
      </div>
    );
  } else if (isSystemPoison) {
    cellContent = (
      <div className="text-purple-600 dark:text-purple-400 text-xl animate-pulse">
        <i className="fa-solid fa-biohazard"></i>
      </div>
    );
  } else if (selected) {
    cellContent = (
      <div className={selectedBy === 'player' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}>
        <i className={selectedBy === 'player' ? 'fa-solid fa-user' : 'fa-solid fa-robot'}></i>
      </div>
    );
  }
    
    return (
      <motion.div
        key={`${x}-${y}`}
         className={cn(cellClass, {
           'cursor-not-allowed opacity-70': gameEnded || (selected && !isPlayerPoison && !isSystemPoison && !isPlacingPoison) || (currentPlayer !== 'player' && !isPlacingPoison)
         })}
         onClick={() => {
           if (isPlacingPoison) {
             !selected && onCellSelect(position);
           } else {
             !selected && !gameEnded && currentPlayer === 'player' && onCellSelect(position);
           }
         }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: (x + y) * 0.02
        }}
        whileHover={{ scale: !selected && currentPlayer === 'player' && !gameEnded ? 1.1 : 1 }}
        whileTap={{ scale: 0.95 }}
      >
        {cellContent}
      </motion.div>
    );
  };
  
  // 创建网格行
  const renderRow = (y: number) => {
    return (
      <div key={y}>
        {Array.from({ length: size }, (_, i) => renderCell(i + 1, y))}
      </div>
    );
  };
  
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-inner bg-gray-50 dark:bg-gray-800">
      <div className={`grid grid-cols-${size}`}>
        {Array.from({ length: size }, (_, i) => renderRow(i + 1))}
      </div>
    </div>
  );
}