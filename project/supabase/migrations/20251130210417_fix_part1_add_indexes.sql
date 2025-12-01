/*
  # Fix Security Issues - Part 1: Add Missing Foreign Key Indexes
  
  Adds 15 missing foreign key indexes to improve JOIN performance
  and prevent table scans.
*/

-- Battle emotes indexes
CREATE INDEX IF NOT EXISTS idx_battle_emotes_match_id ON battle_emotes(match_id);
CREATE INDEX IF NOT EXISTS idx_battle_emotes_user_id ON battle_emotes(user_id);

-- Battle live matches indexes
CREATE INDEX IF NOT EXISTS idx_battle_live_matches_current_turn ON battle_live_matches(current_turn);
CREATE INDEX IF NOT EXISTS idx_battle_live_matches_player2_id ON battle_live_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_battle_live_matches_winner_id ON battle_live_matches(winner_id);

-- Battle matches indexes
CREATE INDEX IF NOT EXISTS idx_battle_matches_opponent_id ON battle_matches(opponent_id);
CREATE INDEX IF NOT EXISTS idx_battle_matches_player_id ON battle_matches(player_id);

-- Battle matchmaking queue indexes
CREATE INDEX IF NOT EXISTS idx_battle_matchmaking_queue_deck_id ON battle_matchmaking_queue(deck_id);
CREATE INDEX IF NOT EXISTS idx_battle_matchmaking_queue_matched_with ON battle_matchmaking_queue(matched_with);

-- Player battle stats indexes
CREATE INDEX IF NOT EXISTS idx_player_battle_stats_favorite_card_id ON player_battle_stats(favorite_card_id);

-- Player cards indexes
CREATE INDEX IF NOT EXISTS idx_player_cards_card_id ON player_cards(card_id);

-- Player decks indexes
CREATE INDEX IF NOT EXISTS idx_player_decks_user_id ON player_decks(user_id);

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

-- User challenge progress indexes
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);

-- User vocabulary indexes
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_story_id ON user_vocabulary(story_id);
