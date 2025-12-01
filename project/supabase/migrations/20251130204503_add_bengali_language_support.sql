/*
  # Add Bengali Language Support
  
  Adds Bengali (বাংলা) to the supported languages list.
  Bengali is one of the most widely spoken languages in the world.
  
  ## Changes
  
  1. Update user_profiles language constraint
     - Add support for: bn (Bengali/বাংলা)
     - Total supported: en, es, fr, de, pt, zh, ja, ar, hi, ru, bn (11 languages)
  
  ## Supported Languages (11)
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
  - bn: Bengali (বাংলা) - NEW!
*/

-- Drop existing constraint
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_language_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with Bengali included
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_language_check 
  CHECK (language IN ('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi', 'ru', 'bn'));
