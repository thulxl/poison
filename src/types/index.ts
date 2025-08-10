/**
 * 游戏相关类型定义
 */

// 游戏状态类型
export type GameStatus = 'setup' | 'placing_poison' | 'dice' | 'playing' | 'ended';

// 玩家类型
export type Player = 'player' | 'system';

// 位置坐标类型
export interface Position {
  x: number;
  y: number;
}

// 毒药放置状态
export type PoisonPlacementStatus = 'pending' | 'completed';

// API调试数据类型
export interface ApiDebugEntry {
  request: any;
  prompt?: string;
  response: any | { error: string } | { raw: string; parsed: Position };
}

// 毒药位置历史记录类型
export interface PoisonHistoryEntry {
  round: number;
  playerPoison: Position;
  systemPoison: Position;
  timestamp: Date;
}

// 骰子结果类型
export interface DiceResult {
  player: number;
  system: number;
}