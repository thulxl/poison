import { cn } from '@/lib/utils';
import { useState } from 'react';

type GameStatus = 'setup' | 'placing_poison' | 'dice' | 'playing' | 'ended';

  interface GameControlsProps {
  showApiResponse: boolean;
   mapSize: number;
   setMapSize: (size: number) => void;
   gameStatus: GameStatus;
   onStartGame: () => void;
   onRestartGame: () => void;
   onShowPoisons: () => void;
   showPoisons: boolean;
   apiKey: string;
   modelId: string;
   thinkingMode: 'enabled' | 'disabled' | 'auto';
  onApiConfigChange: (type: 'apiKey' | 'modelId' | 'thinkingMode', value: string) => void;
  onShowResponse?: () => void;
 }
 

 export default function GameControls({
   mapSize,
   setMapSize,
   gameStatus,
   onStartGame,
   onRestartGame,
   onShowPoisons,
   showPoisons,
  apiKey,
  modelId,
  thinkingMode,
  onApiConfigChange,
  onShowResponse,
  showApiResponse
 }: GameControlsProps) {
   const [sizeInput, setSizeInput] = useState(mapSize.toString());
 
   // 检查API配置是否完整
   const isApiConfigComplete = () => {
     return apiKey.trim() !== '' && modelId.trim() !== '';
   };
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 只允许输入3-10之间的数字
    const value = e.target.value;
    if (/^\d*$/.test(value) && (value === '' || (parseInt(value) >= 3 && parseInt(value) <= 10))) {
      setSizeInput(value);
    }
  };
  
  const handleSizeBlur = () => {
    // 失去焦点时确认地图大小
    const size = parseInt(sizeInput) || 5;
    const clampedSize = Math.min(Math.max(size, 3), 10);
    setMapSize(clampedSize);
    setSizeInput(clampedSize.toString());
  };
  
  return (
     <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
       <div className="space-y-4 mb-4">
         {/* API配置 */}
         <div className={cn(
           "grid grid-cols-1 md:grid-cols-2 gap-4",
           (gameStatus === 'playing' || gameStatus === 'dice' || gameStatus === 'ended') && "opacity-50 pointer-events-none"
         )}>
           <div>
             <label htmlFor="apiKey" className="block text-sm font-medium mb-1">API Key:</label>
             <input
               type="text"
               id="apiKey"
               value={apiKey}
               onChange={(e) => onApiConfigChange('apiKey', e.target.value)}
               className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               disabled={gameStatus === 'playing' || gameStatus === 'dice' || gameStatus === 'ended'}
             />
           </div>
           <div className="flex gap-3">
             <div className="flex-1">
               <label htmlFor="modelId" className="block text-sm font-medium mb-1">Model ID:</label>
               <input
                 type="text"
                 id="modelId"
                 value={modelId}
                 onChange={(e) => onApiConfigChange('modelId', e.target.value)}
                 className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 disabled={gameStatus === 'playing' || gameStatus === 'dice' || gameStatus === 'ended'}
               />
             </div>
             <div className="flex-1">
               <label htmlFor="thinkingMode" className="block text-sm font-medium mb-1">Thinking:</label>
               <select
                 id="thinkingMode"
                 value={thinkingMode}
                 onChange={(e) => onApiConfigChange('thinkingMode', e.target.value)}
                 className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 disabled={gameStatus === 'playing' || gameStatus === 'dice' || gameStatus === 'ended'}
               >
                 <option value="enabled">Enabled</option>
                 <option value="disabled">Disabled</option>
                 <option value="auto">Auto</option>
               </select>
             </div>
           </div>
         </div>
          
             {/* 地图大小和按钮控制区 - 在同一行显示 */}
             <div className="flex items-center justify-between gap-3">
               {/* 地图大小控制区 - 游戏进行时禁用 */}
               <div className={cn(
                 "flex items-center gap-2",
                 (gameStatus === 'playing' || gameStatus === 'dice') && "opacity-50 pointer-events-none"
               )}>
                 <label htmlFor="mapSize" className="text-sm font-medium">地图大小:</label>
                 <input
                   type="text"
                   id="mapSize"
                   value={sizeInput}
                   onChange={handleSizeChange}
                   onBlur={handleSizeBlur}
                   className="w-16 p-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                   disabled={gameStatus === 'playing' || gameStatus === 'dice' || gameStatus === 'ended'}
                 />
                 <span className="text-sm text-gray-500">x {mapSize}</span>
               </div>
               
               {/* 按钮组 - 始终保持可交互 */}
               <div className="flex flex-wrap gap-3">
                 {/* 始终显示重新开始按钮 */}
                 <button
                   onClick={onRestartGame}
                   className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                 >
                   <i className="fa-solid fa-refresh"></i>
                   <span>重新开始</span>
                 </button>
                 
                 {/* 在适当状态显示隐藏/显示毒药按钮 */}
                 {(gameStatus === 'playing' || gameStatus === 'ended') && (
                   <button
                     onClick={onShowPoisons}
                     className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                       showPoisons 
                         ? 'bg-green-600 hover:bg-green-700 text-white' 
                         : 'bg-amber-600 hover:bg-amber-700 text-white'
                     }`}
                   >
                     <i className="fa-solid fa-eye"></i>
                      <span>{showPoisons ? '隐藏系统毒药' : '显示系统毒药'}</span>
                   </button>
                 )}
                 
                 {/* 显示API响应按钮 - 始终显示 */}
                 <button
                   onClick={() => onShowResponse?.()}
                   className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                 >
                   <i className="fa-solid fa-code"></i>
                    <span>{showApiResponse ? '隐藏Response' : '显示Response'}</span>
                 </button>
               </div>
             </div>
        </div>
       
       <div className="flex flex-wrap items-center justify-between gap-4">
        
         {/* 控制按钮组 */}
         <div className="flex gap-3">
            {gameStatus === 'setup' && (
              <button
                onClick={onStartGame}
                disabled={!isApiConfigComplete()}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2",
                  isApiConfigComplete() 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                )}
              >
                <i className="fa-solid fa-play"></i>
                <span>开始游戏</span>
              </button>
            )}
         </div>
      </div>
      
      {/* 游戏说明 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>游戏规则: 轮流选择地图上的位置，选中任何毒药位置则失败</p>
      </div>
    </div>
  );
}