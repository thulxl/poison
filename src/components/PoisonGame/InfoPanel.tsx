 import { cn } from '@/lib/utils';
 import { useTheme } from '@/hooks/useTheme';
 interface Position {
  x: number;
  y: number;
}

type GameStatus = 'setup' | 'dice' | 'playing' | 'ended';

  interface PoisonHistoryEntry {
    round: number;
    playerPoison: Position;
    systemPoison: Position;
    timestamp: Date;
  }

  interface InfoPanelProps {
    gameStatus: GameStatus;
    currentPlayer: 'player' | 'system';
    playerPoison: Position | null;
    systemPoison: Position | null;
    selectedPositions: Position[];
    winner: 'player' | 'system' | null;
    diceRoll: {player: number, system: number} | null;
    startingPlayer: 'player' | 'system' | null;
    poisonHistory?: PoisonHistoryEntry[];
  }

 export default function InfoPanel({
   gameStatus,
   currentPlayer,
   playerPoison,
   systemPoison,
   selectedPositions,
   winner,
   diceRoll,
  startingPlayer,
  poisonHistory
 }: InfoPanelProps) {
  // 格式化坐标显示
  const formatPosition = (position: Position | null) => {
    if (!position) return '未知';
    return `(${position.x}, ${position.y})`;
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <i className="fa-solid fa-info-circle text-blue-500"></i>
          <span>游戏信息</span>
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400">游戏状态:</span>
            <span className="font-medium">
               {gameStatus === 'setup' && '准备中'}
               {gameStatus === 'placing_poison' && '放置毒药'}
               {gameStatus === 'dice' && '掷骰子'}
               {gameStatus === 'playing' && '游戏中'}
               {gameStatus === 'ended' && '已结束'}
             </span>
          </div>
          
          {gameStatus === 'playing' && (
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400">当前回合:</span>
              <span className="font-medium flex items-center gap-1">
                {currentPlayer === 'player' ? (
                  <>
                    <i className="fa-solid fa-user text-blue-500"></i>
                    <span>玩家</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-robot text-gray-500"></i>
                    <span>系统</span>
                  </>
                )}
              </span>
            </div>
          )}
          
          {gameStatus === 'ended' && winner && (
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400">游戏结果:</span>
              <span className="font-medium flex items-center gap-1">
                {winner === 'player' ? (
                  <>
                    <i className="fa-solid fa-trophy text-yellow-500"></i>
                    <span>玩家胜利</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-robot text-gray-500"></i>
                    <span>系统胜利</span>
                  </>
                )}
              </span>
            </div>
          )}
          
          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400">已选择位置:</span>
            <span className="font-medium">{selectedPositions.length}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <i className="fa-solid fa-map-marker-alt text-red-500"></i>
          <span>毒药位置</span>
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <i className="fa-solid fa-user text-blue-500"></i>
              <span>你的毒药:</span>
            </span>
            <span className={playerPoison ? "font-medium" : "text-gray-400 italic"}>
              {formatPosition(playerPoison)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <i className="fa-solid fa-robot text-gray-500"></i>
              <span>系统毒药:</span>
            </span>
            <span className={systemPoison ? "font-medium" : "text-gray-400 italic"}>
              {formatPosition(systemPoison)}
            </span>
          </div>
        </div>
      </div>
      
      {(gameStatus === 'dice' || diceRoll) && (
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-dice text-purple-500"></i>
            <span>骰子结果</span>
          </h3>
          {diceRoll ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">玩家</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{diceRoll.player}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-600/20 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">系统</div>
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{diceRoll.system}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              点击掷骰子按钮开始
            </div>
          )}
        </div>
      )}
       
  {(gameStatus === 'playing' || gameStatus === 'ended') && selectedPositions.length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <i className="fa-solid fa-history text-amber-500"></i>
        <span>选择历史</span>
      </h3>
          <div className="max-h-[120px] overflow-y-auto text-sm space-y-1 pr-1">
           {selectedPositions.map((pos, index) => (
             <div key={index} className="py-1 px-2 rounded bg-gray-50 dark:bg-gray-600/20 flex justify-between">
           <span>
               {startingPlayer === 'system' ? (
                 index % 2 === 0 ? (
                   <span className="text-gray-600 dark:text-gray-400">系统</span>
                 ) : (
                   <span className="text-blue-600 dark:text-blue-400">你</span>
                 )
               ) : (
                 index % 2 === 0 ? (
                   <span className="text-blue-600 dark:text-blue-400">你</span>
                 ) : (
                   <span className="text-gray-600 dark:text-gray-400">系统</span>
                 )
               )}
              选择了
           </span>
           <span className="font-medium">({pos.x}, {pos.y})</span>
         </div>
       )).reverse()}
     </div>
   </div>
 )}
 
  {/* 毒药历史记录面板 - 始终显示，即使没有历史记录 */}
  <div>
    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
      <i className="fa-solid fa-clock-rotate-left text-purple-500"></i>
      <span>毒药位置历史</span>
    </h3>
    
    {poisonHistory && poisonHistory.length > 0 ? (
      <div className="max-h-[150px] overflow-y-auto text-sm space-y-2 pr-1">
        {poisonHistory.map((entry, index) => (
          <div key={index} className="py-2 px-3 rounded bg-gray-50 dark:bg-gray-600/20 hover:bg-gray-100 dark:hover:bg-gray-600/40 transition-colors">
            <div className="text-xs text-gray-500 mb-1">
              第{entry.round}轮 · {entry.timestamp.toLocaleString()}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">你的毒药:</span>
                <span className="font-medium">({entry.playerPoison.x}, {entry.playerPoison.y})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">系统毒药:</span>
                <span className="font-medium">({entry.systemPoison.x}, {entry.systemPoison.y})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
        <i className="fa-solid fa-history mb-2 text-2xl opacity-30"></i>
        <p>暂无历史记录</p>
        <p className="text-xs mt-1">完成第一轮游戏后将显示历史记录</p>
      </div>
    )}
  </div>
    </div>
  );
}
