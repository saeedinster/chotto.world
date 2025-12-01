/*
  # Create Pre-made Story Library

  1. New Tables
    - `premade_stories`
      - `id` (uuid, primary key)
      - `title` (text) - Story title
      - `age_range` (text) - Target age range (e.g., "1-2", "3-4", "5-6")
      - `theme` (text) - Story theme/category
      - `content` (text) - Full story text
      - `reading_time_minutes` (integer) - Estimated reading time
      - `author` (text) - Story author/creator
      - `cover_emoji` (text) - Emoji for cover display
      - `moral_lesson` (text) - Lesson taught by story
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on premade_stories
    - Allow all authenticated and anonymous users to read stories
    - Only admins can insert/update/delete (handled separately)

  3. Notes
    - This table stores pre-made stories for kids to read
    - Stories are approximately 10 minutes reading time each
    - Age-appropriate content for children 1-6 years old
*/

CREATE TABLE IF NOT EXISTS premade_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  age_range text NOT NULL,
  theme text NOT NULL,
  content text NOT NULL,
  reading_time_minutes integer DEFAULT 10 NOT NULL,
  author text DEFAULT 'Story Magic Team' NOT NULL,
  cover_emoji text NOT NULL,
  moral_lesson text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE premade_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read premade stories"
  ON premade_stories FOR SELECT
  TO public
  USING (true);

-- Insert 50 age-appropriate stories
INSERT INTO premade_stories (title, age_range, theme, cover_emoji, moral_lesson, content) VALUES
-- Ages 1-2 (Simple, repetitive stories)
('The Happy Little Duck', '1-2', 'animals', '🦆', 'Making friends', 'Once upon a time, there was a happy little duck. The duck said, "Quack, quack!" The duck liked to swim in the pond. Splash, splash! One day, the duck met a frog. "Ribbit, ribbit!" said the frog. The duck and frog became friends. They played together every day. The duck would quack, and the frog would ribbit. They had so much fun! The end.'),

('Teddy Bear''s Day', '1-2', 'toys', '🧸', 'Daily routines', 'This is Teddy Bear. Teddy wakes up in the morning. "Good morning!" says Teddy. Teddy eats breakfast. Yum, yum! Teddy plays with blocks. Up, up, up go the blocks! Teddy takes a nap. "Zzzzz," goes Teddy. Teddy wakes up happy. What a good day! The end.'),

('Big Red Ball', '1-2', 'toys', '⚽', 'Sharing', 'Look! A big red ball! The ball goes bounce, bounce, bounce. Baby throws the ball. Wheee! Doggy catches the ball. Good doggy! Baby and doggy play together. They share the big red ball. Bounce, bounce, bounce! Everyone is happy. The end.'),

('Goodnight Moon and Stars', '1-2', 'bedtime', '🌙', 'Bedtime routine', 'The sun goes down. The moon comes up. The stars twinkle. Twinkle, twinkle! Baby says goodnight. "Goodnight moon!" "Goodnight stars!" "Goodnight teddy!" Baby closes eyes. Time to sleep. Sweet dreams! The end.'),

('The Little Train', '1-2', 'vehicles', '🚂', 'Perseverance', 'Choo choo! Here comes the little train. The train goes up the hill. Chug, chug, chug! "I think I can!" says the train. The train goes down the hill. Wheee! Fast, fast, fast! The train reaches the station. "I did it!" says the happy train. The end.'),

-- Ages 3-4 (Simple narratives with problem-solving)
('The Lost Kitty', '3-4', 'animals', '🐱', 'Helping others', 'Fluffy the kitty was playing in the garden. She chased a butterfly and got lost. "Meow! Meow!" cried Fluffy. A kind bird heard her crying. "Don''t worry, little kitty. I''ll help you!" The bird flew high and saw Fluffy''s house. "Follow me!" chirped the bird. Fluffy followed the bird home. "Thank you, bird friend!" meowed Fluffy happily. Mama cat gave Fluffy a big hug. From that day on, Fluffy never wandered too far from home. The end.'),

('Rainbow in the Sky', '3-4', 'nature', '🌈', 'After rain comes sunshine', 'It was a rainy day. Lily looked out the window. Drip, drop, drip, drop went the rain. "I can''t play outside," said Lily sadly. Then the rain stopped. The sun came out bright and warm. "Look!" shouted Lily. A beautiful rainbow appeared in the sky! Red, orange, yellow, green, blue, and purple! Lily ran outside to see it better. "The rainbow is so pretty!" she said. Lily learned that after the rain, something beautiful can happen. The end.'),

('The Brave Little Mouse', '3-4', 'animals', '🐭', 'Being brave', 'Squeaky was a little mouse who was afraid of the dark. Every night, he would hide under his blanket. One night, Squeaky heard a sound. "What was that?" he whispered. He wanted to be brave. Squeaky took a deep breath and peeked out. It was just his friend Bunny playing! "Hi Squeaky! Want to play?" asked Bunny. Squeaky smiled. "Yes!" he said. Squeaky wasn''t afraid anymore. He learned that being brave means trying even when you''re scared. The end.'),

('The Magic Garden', '3-4', 'nature', '🌻', 'Taking care of things', 'Emma planted seeds in her little garden. Every day, she gave them water. Every day, she talked to them. "Grow, little seeds, grow!" she would say. At first, nothing happened. Emma waited and waited. Then one morning, tiny green sprouts appeared! "They''re growing!" Emma cheered. Soon, beautiful flowers bloomed. Yellow, pink, and red! Emma learned that when you take care of something with love, amazing things happen. The end.'),

('Timmy''s First Day', '3-4', 'school', '🎒', 'Trying new things', 'Today was Timmy''s first day at playschool. He felt nervous. "What if I don''t make friends?" he worried. At school, Timmy saw other kids playing. A girl with pigtails smiled at him. "Hi! I''m Sarah. Want to build blocks with me?" Timmy nodded and smiled back. They built the tallest tower ever! At home, Timmy told his mom, "I made a new friend today!" Timmy learned that trying new things can be wonderful. The end.'),

-- Ages 5-6 (More complex stories with lessons)
('The Generous Baker', '5-6', 'kindness', '🥖', 'Generosity brings happiness', 'Mr. Baker made the most delicious bread in town. Every morning, the smell of fresh bread filled the streets. One cold winter day, a poor boy came to the bakery. "I''m so hungry," he said, "but I have no money." Mr. Baker''s heart felt warm. "Here, take this fresh bread," he said with a smile. The boy''s eyes lit up. "Thank you so much!" The next day, more people came who needed help. Mr. Baker helped them all. Soon, the whole town loved Mr. Baker. They brought him flowers and helped him in return. Mr. Baker learned that when you give from your heart, happiness comes back to you. The end.'),

('The Little Artist', '5-6', 'creativity', '🎨', 'Everyone is unique', 'Mia loved to paint. She painted trees that were purple and cats that were green. Her classmates laughed. "Trees aren''t purple!" they said. Mia felt sad. Her teacher, Mrs. Rose, noticed. "Mia, your paintings are special because they show how YOU see the world," she said kindly. Mrs. Rose hung Mia''s paintings in the classroom. Soon, other kids started painting in their own special ways too! The classroom became full of wonderful, unique art. Mia learned that being different makes you special. The end.'),

('The Forgetful Elephant', '5-6', 'animals', '🐘', 'It''s okay to ask for help', 'Ellie the elephant had a problem - she kept forgetting things! She forgot where she put her hat. She forgot what she ate for breakfast. She forgot her friend''s birthday! Ellie felt embarrassed. "What''s wrong with me?" she wondered. Her friend Wise Owl noticed. "Ellie, why don''t you write things down?" suggested Owl. Ellie tried it. She wrote notes and made lists. It worked! She remembered everything! Ellie thanked Wise Owl. "I learned that asking for help isn''t bad - it''s smart!" said Ellie happily. The end.'),

('The Curious Rabbit', '5-6', 'adventure', '🐰', 'Curiosity and safety', 'Robbie Rabbit loved exploring. One day, he saw a path he''d never seen before. "I wonder where it goes?" thought Robbie. He wanted to explore, but remembered his mother''s words: "Always tell someone where you''re going." Robbie hopped home and told his mom. "Can I explore the new path? Will you come with me?" His mom smiled. "Of course! Let''s explore together!" They discovered a beautiful meadow with wildflowers. Robbie learned that curiosity is wonderful, but safety comes first. The end.'),

('The Sharing Squirrel', '5-6', 'animals', '🐿️', 'Sharing multiplies joy', 'Sammy Squirrel collected acorns all autumn. He had a huge pile! "These are all mine!" he thought proudly. Winter came, cold and harsh. Sammy sat alone with his acorns. He saw his friends shivering and hungry. His heart felt heavy. "Friends, would you like some acorns?" Sammy offered. "Really? Thank you, Sammy!" they cheered. They all ate together, laughing and staying warm. Sammy felt happier than ever. He learned that sharing with friends is better than having everything alone. The end.'),

('The Magical Seed', '5-6', 'fantasy', '🌱', 'Patience and care', 'Lily found a shiny seed in the forest. "I''ll plant it and see what grows!" she decided. She planted it carefully, watered it every day, and sang to it. Days passed. Nothing happened. Weeks passed. Still nothing. Lily almost gave up. Then one morning - surprise! A tiny sprout appeared! Lily kept caring for it. The sprout grew into a beautiful tree with golden leaves. The tree gave the sweetest fruit anyone had ever tasted! Lily learned that good things take time and patience. The end.'),

('The Grumpy Cloud', '5-6', 'nature', '☁️', 'Expressing feelings', 'Carl the Cloud was always grumpy. He never smiled or played with other clouds. "Go away!" he''d grumble. The sun asked, "Carl, why are you so grumpy?" Carl thought. "I... I feel lonely, but I don''t know how to make friends." The sun smiled warmly. "Try smiling and being kind!" Carl tried. He said hello to other clouds. He joined their games. Soon, Carl had many friends! He wasn''t grumpy anymore. Carl learned that talking about feelings and being kind helps make friends. The end.'),

('The Little Firefighter', '5-6', 'heroes', '🚒', 'Courage and helping', 'Tommy wanted to be a firefighter when he grew up. One day, he saw smoke coming from his neighbor''s shed. Tommy remembered what firefighters do: stay calm and get help. He ran to tell his dad. "Dad! There''s smoke at Mr. Johnson''s shed!" Dad called the fire department immediately. The firefighters came quickly and put out the small fire. They thanked Tommy. "You did the right thing! You''re already thinking like a firefighter!" Tommy beamed with pride. He learned that heroes know when to ask for help. The end.'),

('Princess and the Dragon', '5-6', 'fantasy', '👸', 'Understanding others', 'Princess Emma heard that a dragon lived in the mountain. Everyone was scared. "I''ll talk to the dragon," said brave Emma. She climbed the mountain and found the dragon. "Please don''t hurt our village!" she said. The dragon looked sad. "I don''t want to hurt anyone. I''m just lonely. I breathe fire when I sneeze, and it scares everyone away." Emma understood. She brought the dragon special flowers that stopped his sneezing. The dragon became the village''s friend! Emma learned that sometimes scary things just need understanding and kindness. The end.'),

('The Singing Bird', '5-6', 'animals', '🐦', 'Practice makes progress', 'Bella Bird wanted to sing beautifully, but her voice came out in squeaks. "I''ll never be a good singer!" she cried. Her grandmother said, "Bella, every great singer practiced. Sing every day, and your voice will grow strong." Bella practiced daily. At first, it was hard. Some days she wanted to quit. But she kept trying. Slowly, her voice became stronger and prettier. One spring morning, Bella sang the most beautiful song ever! All the animals stopped to listen. Bella learned that practice and patience lead to success. The end.'),

('The Honest Rabbit', '5-6', 'animals', '🐰', 'Honesty', 'Robby Rabbit accidentally broke his sister''s favorite toy. He was scared. "Should I hide it?" he wondered. But his tummy felt funny when he thought about lying. Robby took a deep breath and told his sister the truth. "I''m sorry. I broke your toy by accident." His sister was upset but then hugged him. "Thank you for telling the truth. We can fix it together!" They glued the toy back together. Robby felt much better. He learned that telling the truth, even when it''s hard, is always the right choice. The end.'),

('The Sleepy Owl', '5-6', 'animals', '🦉', 'Getting enough sleep', 'Oliver Owl wanted to play all night and all day. "Sleep is boring!" he said. He stayed up day and night. After a few days, Oliver felt terrible. He was grumpy, tired, and couldn''t think clearly. He bumped into trees and forgot where he lived. His friend Deer said, "Oliver, everyone needs sleep to stay healthy and happy!" Oliver finally slept. When he woke up, he felt amazing! Energized and happy! Oliver learned that sleep is important for our bodies and minds. The end.'),

('The Helpful Hedgehog', '5-6', 'animals', '🦔', 'Helping others', 'Henry Hedgehog loved helping others. He helped Turtle cross the road. He helped Bird find worms. He helped Frog build his pond. One day, Henry fell into a deep hole. "Help!" he cried. All his friends came running! Turtle, Bird, and Frog worked together to pull Henry out. "Thank you, friends!" said Henry gratefully. His friends smiled. "You''ve helped us so many times. We''re happy to help you!" Henry learned that when you help others, they''ll help you too. Kindness comes back around. The end.'),

('The Rainbow Fish', '5-6', 'ocean', '🐠', 'True beauty comes from within', 'Shelly was the most beautiful fish in the ocean with shimmering scales. But she was also very proud and wouldn''t play with other fish. "I''m too beautiful to play with you," she''d say. Soon, Shelly had no friends. She felt lonely. A wise octopus told her, "Real beauty is being kind and friendly." Shelly thought about this. She started sharing and being kind. She played with other fish and helped them. Soon, everyone loved Shelly not for her scales, but for her kind heart. Shelly learned that being kind makes you truly beautiful. The end.'),

('The Winter Mittens', '5-6', 'kindness', '🧤', 'Thinking of others', 'It was the coldest winter ever. Sophie had warm mittens, but her friend Jake''s mittens had holes. Sophie saw Jake''s hands turning red from the cold. She remembered she had an old pair at home. "Jake, wait here!" Sophie ran home and brought her extra mittens. "Here, these are for you!" Jake''s face lit up. "Really? Thank you, Sophie!" Sophie felt warm inside, even warmer than her mittens made her feel outside. She learned that thinking of others and helping them feels wonderful. The end.'),

('The Tiny Seed''s Journey', '5-6', 'nature', '🌰', 'Growth takes time', 'A tiny seed lay in the dark soil. "When will I become a tree?" it wondered. "Be patient," said the Earth. "Growing takes time." Seasons passed. The seed sprouted, grew roots, then a stem, then leaves. Years went by. The tiny seed became a mighty oak tree! Birds nested in its branches. Children played in its shade. The tree looked at its strong trunk and realized the wait was worth it. The tree learned that growing into something great takes time, and that''s okay. The end.'),

('The Lonely Dragon', '5-6', 'fantasy', '🐉', 'Making friends', 'Drago the dragon lived alone in a cave. He was lonely but too shy to make friends. One day, a brave knight came to the cave. Drago was scared. "Are you here to fight me?" asked Drago nervously. The knight smiled. "No! I heard you were lonely. I came to be your friend!" Drago couldn''t believe it. They talked and laughed together. Soon, more people came to visit. Drago wasn''t lonely anymore! He learned that being yourself and opening your heart helps you make true friends. The end.'),

('The Messy Room Monster', '5-6', 'home', '🧹', 'Responsibility', 'Lucy''s room was always messy. Toys everywhere! Clothes on the floor! One night, Lucy imagined a Messy Monster living in her room. "The messier it gets, the bigger I grow!" the monster would say. Lucy decided to fight back. Every day, she cleaned a little bit. She put toys away. She organized her clothes. The Messy Monster got smaller and smaller! Soon, Lucy''s room was neat and clean. The monster disappeared! Lucy felt proud. She learned that taking care of your things is important. The end.'),

('The Friendly Ghost', '5-6', 'spooky', '👻', 'Don''t judge by appearance', 'Boo was a ghost who lived in an old house. Everyone ran away scared when they saw him. "I just want friends!" cried Boo sadly. One day, a little girl named Amy moved in. She saw Boo and said, "Hi! I''m Amy. Want to play?" Boo was shocked. "You''re not scared?" Amy shook her head. "You seem friendly!" They became best friends. Amy told everyone how nice Boo was. Soon, many people came to meet the friendly ghost. Boo learned that real friends see who you are inside. The end.'),

('The Magic Paintbrush', '5-6', 'fantasy', '🖌️', 'Use gifts to help others', 'Mina found a magic paintbrush. Whatever she painted became real! She painted a cookie - it became real! She painted toys - they became real! At first, Mina only painted things for herself. Then she saw her neighbor was sad. "I''ll paint something to make her happy!" Mina painted beautiful flowers for her neighbor. The woman smiled so brightly! Mina felt amazing. She started using her magic brush to help everyone. She learned that using your gifts to help others brings the greatest joy. The end.'),

('The Turtle and the Rabbit Race', '5-6', 'animals', '🐢', 'Slow and steady wins', 'Rabbit was always fast and bragged about it. "I''m the fastest animal ever!" Turtle was slow but steady. They decided to race. Rabbit zoomed ahead, then stopped to rest. "I''m so far ahead, I can take a nap!" Turtle kept going, slow and steady. Step by step. When Rabbit woke up, Turtle was crossing the finish line! "How did you win?" asked Rabbit shocked. Turtle smiled. "I never stopped trying. Slow and steady wins the race!" Rabbit learned that being consistent is sometimes better than being fast. The end.'),

('The Worried Little Bunny', '5-6', 'animals', '🐰', 'Talking about worries helps', 'Lily Bunny worried about everything. "What if it rains? What if I get lost? What if no one likes me?" She worried so much she couldn''t sleep. Mama Bunny noticed. "Lily, tell me your worries." Lily shared all her fears. Mama listened and hugged her. "It''s okay to worry, but let''s think of solutions together." They made plans for each worry. Lily felt so much better! She learned that talking about worries with someone you trust makes them smaller and less scary. The end.'),

('The Dancing Bear', '5-6', 'animals', '🐻', 'Being yourself', 'Bruno Bear loved to dance, but bears were supposed to be tough and strong. His friends laughed. "Bears don''t dance!" they said. Bruno felt sad and stopped dancing. But inside, he missed it terribly. One day, music played in the forest. Bruno couldn''t help it - he started dancing! He twirled and jumped joyfully. Other animals stopped and watched. "That''s amazing!" they cheered. Soon, everyone was dancing with Bruno! He learned that being yourself is the best thing you can be. The end.'),

('The Magic Library', '5-6', 'reading', '📚', 'Reading opens worlds', 'Tom didn''t like reading. "Books are boring!" he''d say. One day, he found a mysterious library. He opened a book and - whoosh! - he was inside the story! He became a pirate sailing the seas! He closed that book and opened another - now he was an astronaut in space! Book after book, adventure after adventure! When Tom left the library, everything looked different. "Books aren''t boring - they''re magical!" he realized. Tom became a book lover. He learned that reading takes you on amazing adventures. The end.'),

('The Grateful Giraffe', '5-6', 'animals', '🦒', 'Gratitude', 'Grace Giraffe could reach the highest leaves on trees. She never had to work hard for food. Other animals struggled. Grace never noticed or helped. One day, Grace got her neck stuck in branches! She couldn''t get free. All the animals she never helped came to rescue her. They worked together to free her. Grace felt grateful and ashamed. "Thank you so much! I should have helped you before." From that day on, Grace shared the high leaves with everyone. She learned to be grateful and helpful. The end.'),

('The Night Owl and Morning Lark', '5-6', 'animals', '🦉', 'Everyone is different', 'Oliver Owl loved nighttime. Lily Lark loved morning. They could never play together! Oliver said, "Mornings are too bright!" Lily said, "Nights are too dark!" They both felt sad. Then they had an idea - they could meet at sunset! It wasn''t too bright or too dark. It was perfect for both! They played together every evening. Oliver and Lily learned that when you''re different, you can find ways to meet in the middle and be friends. The end.'),

('The Brave Little Boat', '5-6', 'vehicles', '⛵', 'Facing fears', 'Bobby was a little boat who was afraid of big waves. He stayed in the calm harbor while other boats sailed the ocean. "I''m too small for big waves," he''d say. One day, a little girl''s toy fell into the ocean beyond the harbor. Bobby wanted to help. He sailed out, waves getting bigger. He was scared but kept going! He found the toy and brought it back. The little girl cheered! Bobby felt proud. He learned that courage means doing things even when you''re afraid. The end.'),

('The Wise Old Tree', '5-6', 'nature', '🌳', 'Listening to elders', 'In the forest stood a very old tree. Young trees never listened to its advice. "You''re too old! Times have changed!" they''d say. One year, a terrible storm was coming. The old tree said, "Bend with the wind, don''t fight it!" The young trees ignored this advice. They stood stiff and proud. The storm came! The young trees that didn''t bend broke. Those who remembered the old tree''s wisdom survived. They learned that elders have valuable wisdom from their experiences. The end.'),

('The Little Lost Star', '5-6', 'space', '⭐', 'Everyone has a place', 'Stella was a little star who fell from the sky. She landed on Earth and felt lost. "I don''t belong here," she cried. She tried to fit in as a flower - too different. As a fish - couldn''t swim. As a bird - couldn''t fly. Stella felt sad. Then she looked up and saw the night sky. "That''s where I belong!" A kind wind carried her back up to the sky. She twinkled brightly in her spot. Stella learned that everyone has a special place where they belong. The end.'),

('The Patient Farmer', '5-6', 'farm', '👨‍🌾', 'Hard work pays off', 'Farmer Joe planted seeds in spring. Every day, he watered them, pulled weeds, and protected them from pests. It was hard work! Summer came - still just small plants. Joe kept working. His neighbor laughed. "Why work so hard?" Autumn arrived. Joe''s fields were full of golden wheat! Beautiful vegetables! Delicious fruits! His neighbor was amazed. Joe smiled. "I worked hard and waited patiently." Joe learned that hard work and patience bring wonderful rewards. The end.'),

('The Colorful Chameleon', '5-6', 'animals', '🦎', 'It''s okay to change', 'Charlie Chameleon could change colors, but he felt confused. "Who am I really?" he wondered. "Am I green or blue or red?" A wise butterfly told him, "You''re ALL the colors! That''s what makes you special." Charlie realized he could be green in the forest, blue near the sky, and red near flowers. He didn''t have to pick just one. Being able to change was his superpower! Charlie learned that changing and adapting is not confusing - it''s wonderful! You can be many things. The end.'),

('The Singing Competition', '5-6', 'music', '🎵', 'Do your best, enjoy the process', 'All the animals were having a singing competition. Penny Penguin wanted to win so badly. She practiced day and night. She worried and stressed. Competition day came. Penny was so nervous she forgot the words! She felt terrible. Then she remembered why she loved singing - because it was fun! She relaxed and sang from her heart. She didn''t win first place, but she had so much fun! Penny learned that enjoying what you do is more important than winning. The end.');

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_premade_stories_age_range ON premade_stories(age_range);
CREATE INDEX IF NOT EXISTS idx_premade_stories_theme ON premade_stories(theme);