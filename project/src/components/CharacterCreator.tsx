import { useState } from 'react';
import { Plus, Trash2, ArrowRight, Users } from 'lucide-react';
import { Character } from '../types/story';

interface CharacterCreatorProps {
  onComplete: (characters: Character[]) => void;
}

const characterEmojis = ['👧', '👦', '🧒', '👶', '🐶', '🐱', '🦊', '🐻', '🦁', '🐯', '🦄', '🐉', '🦋', '🌟', '👑', '🧙'];
const characterColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export function CharacterCreator({ onComplete }: CharacterCreatorProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👧');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [selectedRole, setSelectedRole] = useState<'main' | 'supporting'>('main');

  const addCharacter = () => {
    if (newCharName.trim()) {
      const newChar: Character = {
        name: newCharName.trim(),
        description: newCharDesc.trim() || 'A wonderful character',
        role: selectedRole,
        color: selectedColor,
        emoji: selectedEmoji,
      };
      setCharacters([...characters, newChar]);
      setNewCharName('');
      setNewCharDesc('');
      setSelectedRole('supporting');
    }
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (characters.length > 0) {
      onComplete(characters);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-300 to-purple-300 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            Create Your Characters!
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-4 border-blue-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Add Character</h3>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="Describe your character..."
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Character Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRole('main')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                      selectedRole === 'main'
                        ? 'bg-yellow-400 text-white shadow-lg scale-105'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    ⭐ Main Hero
                  </button>
                  <button
                    onClick={() => setSelectedRole('supporting')}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                      selectedRole === 'supporting'
                        ? 'bg-blue-400 text-white shadow-lg scale-105'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    👥 Friend
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {characterEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-3xl p-2 rounded-xl transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-blue-400 scale-110 shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Choose Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {characterColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-full h-10 rounded-xl transition-all ${
                        selectedColor === color ? 'ring-4 ring-gray-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={addCharacter}
                disabled={!newCharName.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6" />
                Add Character
              </button>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-4 border-yellow-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Characters</h3>

              {characters.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No characters yet!</p>
                  <p className="text-sm">Add your first character</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {characters.map((char, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-4 shadow-md border-2 hover:shadow-lg transition-shadow"
                      style={{ borderColor: char.color }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="text-4xl p-3 rounded-xl"
                          style={{ backgroundColor: char.color + '40' }}
                        >
                          {char.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xl font-bold text-gray-800">{char.name}</h4>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                char.role === 'main'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {char.role === 'main' ? '⭐ Hero' : '👥 Friend'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{char.description}</p>
                        </div>
                        <button
                          onClick={() => removeCharacter(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {characters.length > 0 && (
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-5 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Continue to Preview
              <ArrowRight className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
