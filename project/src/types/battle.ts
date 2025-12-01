export type CardType = 'character' | 'spell' | 'building';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BattleResult = 'win' | 'loss' | 'draw';

export interface BattleCard {
  id: string;
  name: string;
  emoji: string;
  card_type: CardType;
  rarity: CardRarity;
  cost: number;
  health: number;
  attack: number;
  special_ability: string | null;
  description: string;
  unlock_arena: number;
  created_at: string;
}

export interface PlayerCard {
  id: string;
  user_id: string;
  card_id: string;
  level: number;
  quantity: number;
  unlocked_at: string;
  card?: BattleCard;
}

export interface PlayerDeck {
  id: string;
  user_id: string;
  deck_name: string;
  card_slots: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BattleMatch {
  id: string;
  player_id: string;
  opponent_type: 'ai' | 'player';
  opponent_id: string | null;
  result: BattleResult;
  trophies_gained: number;
  trophies_lost: number;
  duration_seconds: number;
  cards_played: any[];
  played_at: string;
}

export interface PlayerBattleStats {
  id: string;
  user_id: string;
  trophies: number;
  arena_level: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  win_streak: number;
  best_win_streak: number;
  highest_trophies: number;
  total_cards_unlocked: number;
  favorite_card_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattleUnit {
  id: string;
  cardId: string;
  card: BattleCard;
  level: number;
  currentHealth: number;
  maxHealth: number;
  position: number;
  team: 'player' | 'opponent';
  isDead: boolean;
}

export interface BattleState {
  playerHealth: number;
  opponentHealth: number;
  playerElixir: number;
  opponentElixir: number;
  turn: 'player' | 'opponent';
  units: BattleUnit[];
  round: number;
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}
