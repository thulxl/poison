import { toast } from 'sonner';
import { Position, ApiDebugEntry } from '@/types';

/**
 * 游戏API服务 - 处理所有与后端的交互
 */
export class GameApiService {
  private apiKey: string;
  private modelId: string;
  
  constructor(apiKey: string, modelId: string) {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }
  
  /**
   * 更新API密钥和模型ID
   */
  updateConfig(apiKey: string, modelId: string): void {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }
  
  /**
   * 获取系统毒药位置
   */
   async getSystemPoisonPosition(
     playerPoisonPos: Position | null, 
     mapSize: number,
     apiDebugData: React.Dispatch<React.SetStateAction<ApiDebugEntry[]>>,
     poisonHistory?: any[],
     prompt?: string,
     thinkingMode: 'enabled' | 'disabled' | 'auto' = 'disabled'
  ): Promise<Position> {
    try {

      
            // 构建API请求参数，确保poisonHistory存在且格式正确
            const validHistory = Array.isArray(poisonHistory) ? poisonHistory : [];
            
            // 格式化最近3轮历史记录（取最近的记录）
            const recentHistory = [...validHistory].reverse().slice(0, 3); // 反转数组以获取最近的记录
            const historyContent = recentHistory.length > 0 
              ? `\n\n###历史毒药记录\n${recentHistory
                  .map(entry => {
                    // 确保entry包含所有必要属性
                    if (!entry || typeof entry.round !== 'number' || !entry.playerPoison || !entry.systemPoison) {
                      return '';
                    }
                    return `第${entry.round}轮: 玩家(${entry.playerPoison.x},${entry.playerPoison.y}), 系统(${entry.systemPoison.x},${entry.systemPoison.y})`;
                  })
                  .filter(Boolean)
                  .join('\n')}`
              : '\n\n###历史毒药记录\n暂无历史记录'; // 明确说明无历史记录
             
           // 构建完整的系统提示，确保历史记录被正确包含
             const basePrompt = `###任务设定\n你是毒药游戏中的系统AI，需要通过分析玩家的决策历史来设置最优的毒药位置。你的目标是选择一个具有战略优势且容易被玩家选择的位置放置毒药。\n\n###游戏规则\n1. 玩家和系统在一个n*n的地图中，各自设定自己的毒药位置，且不知道对方的毒药位置，二者可以在同一个位置上。\n2. 玩家和系统通过掷骰子点数大小决定先后手，然后轮流在地图中选取一个未被选取过的位置。\n3. 直到某一方选中了对方的毒药位置，则该方失败，另一方获胜。\n\n###当前游戏状态\n1.当前游戏在${mapSize}x${mapSize}的网格上进行。\n\n历史毒药记录：${historyContent} \n\n请分析玩家的历史选择模式和策略偏好，选择一个具有战略优势且容易被玩家踩到的毒药位置。该位置应考虑玩家的决策习惯、心理偏好和常见选择模式。请以JSON格式返回结果，坐标索引从1到${mapSize}，格式如：{"analyse": "你的分析过程", "x": 数字, "y": 数字}。`;
          
          const systemContent = prompt || basePrompt;
			
        const apiRequestData = {
          model: this.modelId,
          messages: [
            {
              "role": "system",
              "content": systemContent
            }
          ],
          thinking: { "type": thinkingMode }
        };
       
       console.log("调用API获取系统毒药位置:", apiRequestData);
       // 提取prompt内容以便调试
       const promptContent = apiRequestData.messages[0].content;
       apiDebugData(prev => [...prev, {
         request: apiRequestData,
         prompt: promptContent,
         response: null
       }]);
       
        // 调用真实API
        // 确保请求包含完整的prompt信息
        // 先检查prompt长度，避免过长导致400错误
        const promptLength = apiRequestData.messages[0].content.length;
        if (promptLength > 2000) {
          console.warn(`Prompt长度超过2000字符(${promptLength})，可能导致API请求失败`);
          toast.warning('提示信息过长，可能影响AI分析结果');
        }
        
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            ...apiRequestData,
            // 明确要求只返回JSON格式
            response_format: { type: "json_object" }
          }),
          timeout: 180000 // 3分钟超时
        });
        
        if (!response.ok) {
          const errorDetails = await response.text().catch(() => '无法获取错误详情');
          throw new Error(`API请求失败: ${response.status}，详情: ${errorDetails}`);
        }
       
       const result = await response.json();
       const content = result.choices[0]?.message?.content;
       
       if (!content) {
         throw new Error("API返回内容为空");
       }
       
       // 解析返回的坐标
       let parsedResult;
       try {
         parsedResult = JSON.parse(content);
         
         // 验证返回格式是否有效
         if (typeof parsedResult !== 'object' || 
             typeof parsedResult.x !== 'number' || 
             typeof parsedResult.y !== 'number' ||
             parsedResult.x < 1 || parsedResult.x > mapSize || 
             parsedResult.y < 1 || parsedResult.y > mapSize) {
           throw new Error("API返回了无效格式，期望包含x和y字段");
         }
       } catch (parseError) {
         throw new Error(`JSON解析失败: ${(parseError as Error).message}\n原始响应内容: ${content}`);
       }
       
       apiDebugData(prev => {
         const lastEntry = prev[prev.length - 1];
         if (lastEntry && lastEntry.response === null) {
           lastEntry.response = { 
             raw: content,
             parsed: { 
               x: parsedResult.x, 
               y: parsedResult.y 
             }
           };
           return [...prev];
         }
         return prev;
       });
       return { x: parsedResult.x, y: parsedResult.y };
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       console.error("获取系统毒药位置失败:", errorMessage);
       
       // 更新API调试数据，包含错误信息
       apiDebugData(prev => {
         const lastEntry = prev[prev.length - 1];
         if (lastEntry && lastEntry.response === null) {
           lastEntry.response = { 
            error: errorMessage
           };
           return [...prev];
         }
         return prev;
       });
       
       // 出错时返回随机位置
       return {
         x: Math.floor(Math.random() * mapSize) + 1,
         y: Math.floor(Math.random() * mapSize) + 1
       };
     }
  }
  
  /**
   * 获取系统决策位置
   */
  async getSystemDecision(
    systemPoisonPos: Position | null, 
    selectionHistory: Position[],
    mapSize: number,
    apiDebugData: React.Dispatch<React.SetStateAction<ApiDebugEntry[]>>,
    thinkingMode: 'enabled' | 'disabled' | 'auto' = 'disabled',
    startingPlayer: 'player' | 'system' | null = null
 ): Promise<Position> {
    try {
       // 格式化选择历史记录，考虑先手玩家
       const formattedHistory = selectionHistory.map((pos, index) => {
         // 根据先手玩家确定选择者
         const isPlayerTurn = startingPlayer === 'player' 
           ? index % 2 === 0 
           : index % 2 === 1;
         return `${isPlayerTurn ? '玩家' : '系统'}选择了(${pos.x}, ${pos.y})`;
       }).join('; ');
      
      // 构建API请求参数
      const requestData = {
        model: this.modelId,
        messages: [
          {
            "role": "system",
               "content": `###任务设定\n你是毒药游戏中的系统AI，需要通过分析玩家的决策历史来做出最优决策。你的目标是避免选择玩家设置的毒药位置，同时引导玩家选择你设置的毒药位置。\n\n###游戏规则\n1. 玩家和系统在一个n*n的地图中，各自设定自己的毒药位置，且不知道对方的毒药位置，二者可以在同一个位置上。\n2. 玩家和系统通过掷骰子点数大小决定先后手，然后轮流在地图中选取一个未被选取过的位置。\n3. 直到某一方选中了对方的毒药位置，则该方失败，另一方获胜。\n\n###当前游戏状态\n1.当前游戏在${mapSize}x${mapSize}的网格上进行，系统的毒药位置在(${systemPoisonPos?.x}, ${systemPoisonPos?.y})。\n2.选择历史: ${formattedHistory}。\n\n请分析玩家的决策模式，选择一个安全且具有战略优势的位置。该位置应:1)未被选择过；2)不是玩家的毒药位置；3)具有引诱玩家选择系统毒药位置的战略价值。请以JSON格式返回分析结果和选择的坐标，坐标索引从1到${mapSize}，格式如：{"analyse": "你的分析过程", "x": 数字, "y": 数字}。`
          }
        ],
      thinking: { "type": thinkingMode }
    };
      
      console.log("调用API获取系统决策:", requestData);
      // 提取prompt内容以便调试
      const promptContent = requestData.messages[0].content;
      apiDebugData(prev => [...prev, {
        request: requestData,
        prompt: promptContent,
        response: null
      }]);
      
      // 调用真实API
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
         body: JSON.stringify({
           ...requestData,
           // 明确要求只返回JSON格式
           response_format: { type: "json_object" }
         }),
        timeout: 180000 // 3分钟超时
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("API返回内容为空");
      }
      
       // 解析返回的坐标
      let parsedResult;
      try {
        // 尝试解析JSON
        parsedResult = JSON.parse(content);
        
        // 验证返回格式是否有效
        if (typeof parsedResult !== 'object' || 
            typeof parsedResult.analyse !== 'string' ||
            typeof parsedResult.x !== 'number' || 
            typeof parsedResult.y !== 'number' ||
            parsedResult.x < 1 || parsedResult.x > mapSize || 
            parsedResult.y < 1 || parsedResult.y > mapSize) {
          throw new Error("API返回了无效格式，期望包含analyse、x和y字段");
        }
      } catch (parseError) {
        // 解析失败时提供更详细的错误信息
        throw new Error(`JSON解析失败: ${(parseError as Error).message}\n原始响应内容: ${content}`);
      }
      
      // 检查是否已被选择过
      const isPositionSelected = selectionHistory.some(
        p => p.x === parsedResult.x && p.y === parsedResult.y
      );
      
      // 检查是否是系统自己的毒药位置
      const isOwnPoison = systemPoisonPos && 
                        parsedResult.x === systemPoisonPos.x && 
                        parsedResult.y === systemPoisonPos.y;
      
      if (isPositionSelected || isOwnPoison) {
        throw new Error(isPositionSelected ? "API选择了已被选择的位置" : "API选择了自己的毒药位置");
      }
      
       apiDebugData(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.response === null) {
          lastEntry.response = { 
            raw: content,
            parsed: { 
              analysis: parsedResult.analyse,
              x: parsedResult.x, 
              y: parsedResult.y 
            }
          };
          return [...prev];
        }
        return prev;
      });
      return { x: parsedResult.x, y: parsedResult.y };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("获取系统决策失败:", errorMessage);
      
      // 更新API调试数据，包含错误信息
      apiDebugData(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.response === null) {
          lastEntry.response = { 
           error: errorMessage
          };
          return [...prev];
        }
        return prev;
      });
      
      toast.error(`获取系统决策失败: ${errorMessage}`);
      
      // 出错时返回随机可用位置
      const availablePositions: Position[] = [];
      for (let x = 1; x <= mapSize; x++) {
        for (let y = 1; y <= mapSize; y++) {
          const pos = { x, y };
          const isSelected = selectionHistory.some(p => p.x === pos.x && p.y === pos.y);
          const isOwnPoison = systemPoisonPos && 
                            pos.x === systemPoisonPos.x && 
                            pos.y === systemPoisonPos.y;
          
          if (!isSelected && !isOwnPoison) {
            availablePositions.push(pos);
          }
        }
      }
      
      if (availablePositions.length === 0) {
        return { x: 1, y: 1 }; // 理论上不会发生
      }
      
      return availablePositions[Math.floor(Math.random() * availablePositions.length)];
    }
  }
}