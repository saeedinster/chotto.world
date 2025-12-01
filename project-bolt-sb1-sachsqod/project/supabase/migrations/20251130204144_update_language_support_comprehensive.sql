/*
  # Update Language Support to 10 Languages
  
  Updates the language preferences to support 10 comprehensive languages
  with full translations.
  
  ## Changes
  
  1. Update user_profiles language constraint
     - Add support for: de (German), pt (Portuguese), ja (Japanese), hi (Hindi), ru (Russian)
     - Total supported: en, es, fr, de, pt, zh, ja, ar, hi, ru
  
  ## Supported Languages (10)
  - en: English
  - es: Spanish (Español)
  - fr: French (Français)
  - de: German (Deutsch)
  - pt: Portuguese (Português)
  - zh: Chinese (中文)
  - ja: Japanese (日本語)
  - ar: Arabic (العربية) - RTL
  - hi: Hindi (हिन्दी)
  - ru: Russian (Русский)
*/

-- Drop existing constraint if exists
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_language_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with all 10 languages
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_language_check 
  CHECK (language IN ('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi', 'ru'));
