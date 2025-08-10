 import { useState, useEffect } from 'react';
 import GameBoard from '@/components/PoisonGame/GameBoard';
 import GameControls from '@/components/PoisonGame/GameControls';
 import InfoPanel from '@/components/PoisonGame/InfoPanel';
 import DiceRoller from '@/components/PoisonGame/DiceRoller';
 import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GameApiService } from '@/services/gameApi';

// 游戏状态类型定义
type GameStatus = 'setup' | 'placing_poison' | 'dice' | 'playing' | 'ended';
type Player = 'player' | 'system';
type Position = { x: number; y: number };
type PoisonPlacementStatus = 'pending' | 'completed';

export default function Home() {
   // 游戏状态管理
   const [mapSize, setMapSize] = useState<number>(5);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
    const [currentPlayer, setCurrentPlayer] = useState<Player>('player');
    const [startingPlayer, setStartingPlayer] = useState<Player | null>(null);
   const [playerPoison, setPlayerPoison] = useState<Position | null>(null);
  const [systemPoison, setSystemPoison] = useState<Position | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [showPoisons, setShowPoisons] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [diceRoll, setDiceRoll] = useState<{player: number, system: number} | null>(null);
  const [poisonPlacementStatus, setPoisonPlacementStatus] = useState<PoisonPlacementStatus>('pending');
  const [isSystemChoosing, setIsSystemChoosing] = useState<boolean>(false);
   const [apiKey, setApiKey] = useState<string>('4b4cf791-7ae0-474b-a45c-f8c8dc33b418');
  const [poisonHistory, setPoisonHistory] = useState<{
    round: number;
    playerPoison: Position;
    systemPoison: Position;
    timestamp: Date;
  }[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
      const [modelId, setModelId] = useState<string>('doubao-seed-1-6-250615');
  const [thinkingMode, setThinkingMode] = useState<'enabled' | 'disabled' | 'auto'>('disabled');
  const [apiDebugData, setApiDebugData] = useState<{request: any, response: any}[]>([]);
  const gameApi = new GameApiService(apiKey, modelId);
     const [showApiResponse, setShowApiResponse] = useState<boolean>(false);
    

  // 初始化游戏 - 开始毒药放置阶段
  const startPoisonPlacement = () => {
    // 重置游戏状态
    setGameStatus('placing_poison');
    setSelectedPositions([]);
    setShowPoisons(false);
    setWinner(null);
    setDiceRoll(null);
    setPlayerPoison(null);
    setSystemPoison(null);
    setPoisonPlacementStatus('pending');
  };

  // 完成毒药放置，进入掷骰子阶段
     const completePoisonPlacement = async () => {
      setIsSystemChoosing(true); // 显示系统正在选择状态
      let systemPos: Position | null = null; // 声明systemPos变量
      
      try {
        // 获取系统毒药位置
        systemPos = await gameApi.getSystemPoisonPosition(
          playerPoison, 
          mapSize,
          setApiDebugData,
          poisonHistory,
          undefined,
          thinkingMode
        );
        
        setApiDebugData(prev => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.response === null) {
            lastEntry.response = systemPos;
            return [...prev];
          }
          return prev;
        });
        setSystemPoison(systemPos);
      } finally {
        setIsSystemChoosing(false); // 无论成功失败都隐藏加载状态
      }
       setPoisonPlacementStatus('completed');
      
       // 存储本轮毒药位置到历史记录（只保留最近5轮）
       if (playerPoison && systemPos && currentRound > 0) {
         setPoisonHistory(prev => {
           const newEntry = {
             round: currentRound,
             playerPoison,
             systemPoison: systemPos,
             timestamp: new Date()
           };
           
           // 添加新记录到开头并限制长度
           const updatedHistory = [newEntry, ...prev].slice(0, 5);
           
           console.log('Added new poison history entry:', newEntry);
           console.log('Updated poison history:', updatedHistory);
           
           return updatedHistory;
         });
         // 增加轮数计数
         setCurrentRound(prev => prev + 1);
       } else {
         console.warn('Failed to save poison history:', { playerPoison, systemPos, currentRound });
       }
    
    // 进入掷骰子阶段
    setTimeout(() => {
      setGameStatus('dice');
    }, 1000);
  };

  // 掷骰子决定谁先开始
  const rollDice = () => {
    const playerRoll = Math.floor(Math.random() * 6) + 1;
    const systemRoll = Math.floor(Math.random() * 6) + 1;
    
    setDiceRoll({ player: playerRoll, system: systemRoll });
    
    // 决定谁先开始
     if (playerRoll > systemRoll) {
       setCurrentPlayer('player');
       setStartingPlayer('player');
     } else if (systemRoll > playerRoll) {
       setCurrentPlayer('system');
       setStartingPlayer('system');
    } else {
      // 如果平局，重新掷骰子
      setTimeout(rollDice, 1000);
      return;
    }
    
    // 进入游戏阶段
    setTimeout(() => {
      setGameStatus('playing');
    }, 2000);
  };

  // 玩家选择位置（可能是放置毒药或游戏中选择）
  const handleCellSelect = (position: Position) => {
    // 毒药放置阶段
    if (gameStatus === 'placing_poison' && poisonPlacementStatus === 'pending') {
      setPlayerPoison(position);
      completePoisonPlacement();
      return;
    }
    
    if (gameStatus !== 'playing' || currentPlayer !== 'player') return;
    
    // 检查是否已经选择过该位置
    if (selectedPositions.some(p => p.x === position.x && p.y === position.y)) {
      return;
    }
    
    // 检查是否选中毒药位置
    const isPlayerPoison = playerPoison && position.x === playerPoison.x && position.y === playerPoison.y;
    const isSystemPoison = systemPoison && position.x === systemPoison.x && position.y === systemPoison.y;
    
    // 添加选中位置
    const newSelectedPositions = [...selectedPositions, position];
    setSelectedPositions(newSelectedPositions);
    
    // 检查游戏是否结束 - 选中任何毒药位置都导致失败
    if (isPlayerPoison || isSystemPoison) {
      // 选中任何毒药位置，玩家失败
      setWinner('system');
      setShowPoisons(true);
      setGameStatus('ended');
      return;
    }
    
    // 切换到系统回合
    setCurrentPlayer('system');
    
    // 系统延迟选择
     setTimeout(async () => {
       await systemSelectPosition(newSelectedPositions);
     }, 1000);
  };

   // 调用豆包大模型API获取系统决策


  // 系统选择位置（使用DeepSeek AI模拟）
   const systemSelectPosition = async (currentSelections: Position[]) => {
    if (gameStatus !== 'playing') return;
    
    // 使用DeepSeek AI模拟选择位置
       const systemPosition = await gameApi.getSystemDecision(
        systemPoison, 
        currentSelections,
        mapSize,
        setApiDebugData,
        thinkingMode,
        startingPlayer
      );
    
    // 添加系统选择的位置
    const newSelectedPositions = [...currentSelections, systemPosition];
    setSelectedPositions(newSelectedPositions);
    
    // 检查系统是否选中毒药位置
    const isPlayerPoison = playerPoison && systemPosition.x === playerPoison.x && systemPosition.y === playerPoison.y;
    const isSystemPoison = systemPoison && systemPosition.x === systemPoison.x && systemPosition.y === systemPoison.y;
    
     if (isSystemPoison || isPlayerPoison) {
      // 系统选中任何毒药位置，系统失败，玩家获胜
      setWinner('player');
      setShowPoisons(true);
      setGameStatus('ended');
      return;
    }
    
    // 切换回玩家回合
    setCurrentPlayer('player');
   };

  // 当游戏状态变为playing且当前玩家是系统时，自动触发系统选择
  useEffect(() => {
    if (gameStatus === 'playing' && currentPlayer === 'system') {
      // 系统延迟选择，模拟思考过程
      setTimeout(() => {
        systemSelectPosition(selectedPositions);
      }, 1500);
    }
  }, [gameStatus, currentPlayer]);

  // 重新开始游戏
  const restartGame = () => {
    setGameStatus('setup');
  };

  // 开始游戏（从设置阶段进入毒药放置阶段）
  const startGame = () => {
    startPoisonPlacement();
  };

  // 切换显示毒药位置
  const toggleShowPoisons = () => {
    setShowPoisons(!showPoisons);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
            毒药游戏
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            选择地图上的位置，但要避开双方的毒药位置！
          </p>
        </header>
        
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <GameControls 
              mapSize={mapSize} 
              setMapSize={setMapSize} 
               gameStatus={gameStatus}
               onStartGame={startGame}
               onRestartGame={restartGame}
               onShowPoisons={toggleShowPoisons}
               showPoisons={showPoisons}
               apiKey={apiKey}
                modelId={modelId}
                thinkingMode={thinkingMode}
               showApiResponse={showApiResponse}
                onShowResponse={() => setShowApiResponse(!showApiResponse)}
                 onApiConfigChange={(type, value) => {
                 if (type === 'apiKey') setApiKey(value);
                 if (type === 'modelId') setModelId(value);
                 if (type === 'thinkingMode') setThinkingMode(value as 'enabled' | 'disabled' | 'auto');
               }}
             />
          
            <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-240px)]">
             {/* 游戏区域 */}
             <div className="flex-1 flex flex-col items-center justify-start min-h-[400px] pt-4 flex-shrink-0">
                {gameStatus === 'setup' && (
                  <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-xl w-full max-w-md">
                    <h2 className="text-2xl font-semibold mb-4">设置游戏</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      选择地图大小，然后点击"开始游戏"按钮
                   </p>
                   <div className="flex justify-center">
                     <i className="fa-regular fa-gamepad text-6xl text-gray-300 dark:text-gray-600"></i>
                   </div>
                 </div>
               )}
               
               {gameStatus === 'placing_poison' && (
                 <div className="w-full max-w-md mx-auto">
                   <div className="text-center mb-4">
                     <h2 className="text-2xl font-semibold mb-2">放置你的毒药</h2>
                     <p className="text-gray-600 dark:text-gray-300">
                       {poisonPlacementStatus === 'pending' 
                         ? '选择地图上的一个位置放置你的毒药' 
                         : '毒药已放置！系统正在放置它的毒药...'}
                     </p>
                   </div>
                    <div className="relative">
                      <GameBoard 
                        size={mapSize} 
                        onCellSelect={handleCellSelect}
                        selectedPositions={playerPoison ? [playerPoison] : []}
                        playerPoison={playerPoison || null}
                        systemPoison={null}
                        currentPlayer="player"
                        gameEnded={false}
                        isPlacingPoison={poisonPlacementStatus === 'pending' && !isSystemChoosing}
                        startingPlayer={startingPlayer}
                      />
                      
                      {isSystemChoosing && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <div className="text-white text-xl font-medium">系统正在选择毒药位置...</div>
                          <div className="text-white/80 text-sm mt-2">分析玩家策略中</div>
                        </div>
                      )}
                    </div>
                 </div>
               )}
               
               {gameStatus === 'dice' && (
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-6">掷骰子决定谁先开始</h2>
                  <DiceRoller 
                    onRoll={rollDice} 
                    results={diceRoll} 
                    currentPlayer={currentPlayer}
                  />
                </div>
              )}
              
              {gameStatus === 'playing' && (
                <div className="w-full max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <p className="text-lg font-medium">
                      {currentPlayer === 'player' ? '你的回合' : '系统思考中...'}
                    </p>
                  </div>
                   <GameBoard 
                     size={mapSize} 
                     onCellSelect={handleCellSelect}
                     selectedPositions={selectedPositions}
                     playerPoison={playerPoison}
                     systemPoison={showPoisons ? systemPoison : null}
                     currentPlayer={currentPlayer}
                     startingPlayer={startingPlayer}
                  />
                </div>
              )}
              
              {gameStatus === 'ended' && (
                <div className="text-center">
                  <div className="mb-6 p-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 inline-block">
                    <i className={`fa-solid ${winner === 'player' ? 'fa-trophy' : 'fa-times'} text-white text-5xl`}></i>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {winner === 'player' ? '恭喜你赢了！' : '系统赢了！'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {winner === 'player' ? '系统选中了毒药位置！' : '你选中了毒药位置！'}
                  </p>
                  <GameBoard 
                    size={mapSize} 
                    onCellSelect={() => {}} // 游戏结束时不可选择
                    selectedPositions={selectedPositions}
                    playerPoison={playerPoison}
                    systemPoison={systemPoison}
                    currentPlayer={currentPlayer}
                     gameEnded={true}
                     startingPlayer={startingPlayer}
                  />
                </div>
              )}
            </div>
            
            {/* 信息面板 */}
             <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 max-h-[600px] overflow-y-auto">
               <InfoPanel 
                 gameStatus={gameStatus}
                 currentPlayer={currentPlayer}
                 playerPoison={playerPoison}
                 systemPoison={showPoisons ? systemPoison : null}
                 selectedPositions={selectedPositions}
                winner={winner}
               diceRoll={diceRoll}
               startingPlayer={startingPlayer}
               poisonHistory={poisonHistory}
             />
           </div>
           
            {/* API调试面板 - 现在位于游戏地图下方 */}
            {showApiResponse && (
               <div className="flex flex-col mt-6 w-full max-w-md mx-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">API调试信息</h3>
                  <button 
                    onClick={() => setShowApiResponse(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                   <div className="flex-grow min-h-[300px] max-h-[calc(100vh-400px)] overflow-y-auto bg-white dark:bg-gray-900 p-4 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                  {apiDebugData.length > 0 ? (
                    apiDebugData.map((entry, index) => (
                      <div key={index} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                         <div className="mb-2 text-gray-500 dark:text-gray-400">请求 #{index + 1}:</div>
                          <pre className="mb-4">{JSON.stringify(entry.request, null, 2)}</pre>
                          <div className="mb-2 text-gray-500 dark:text-gray-400">Prompt:</div>
                          <pre className="mb-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">{entry.prompt}</pre>
                          <div className="mb-2 text-gray-500 dark:text-gray-400">原始响应:</div>
                          <pre className="mb-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">{
                            entry.response?.raw || 
                            entry.response?.rawContent || 
                            (entry.response ? JSON.stringify(entry.response, null, 2) : '加载中...')
                          }</pre>
                          {entry.response?.error && (
                            <div className="mb-2 text-red-500 dark:text-red-400">错误信息:</div>
                          )}
                          {entry.response?.error && (
                            <pre className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-600 dark:text-red-300">{entry.response.error}</pre>
                          )}
                           {entry.response?.parsed && entry.response.parsed.analysis && (
                            <div className="mb-2 text-gray-500 dark:text-gray-400">AI分析:</div>
                          )}
                          {entry.response?.parsed && entry.response.parsed.analysis && (
                            <pre className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">{entry.response.parsed.analysis}</pre>
                          )}
                          {entry.response?.parsed && (
                            <div className="mb-2 text-gray-500 dark:text-gray-400">选择坐标:</div>
                          )}
                          {entry.response?.parsed && (
                            <pre className="mb-4">{JSON.stringify({x: entry.response.parsed.x, y: entry.response.parsed.y}, null, 2)}</pre>
                          )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      暂无API调用数据
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}