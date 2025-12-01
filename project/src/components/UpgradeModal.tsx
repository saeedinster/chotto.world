import React from 'react';
import { X, Zap, Star, Sparkles, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { StripeCheckout } from './StripeCheckout';

interface UpgradeModalProps {
  onClose: () => void;
  actionType: 'game' | 'story' | 'battle';
  currentCount: number;
  limit: number;
}

export function UpgradeModal({ onClose, actionType, currentCount, limit }: UpgradeModalProps) {
  const { t } = useLanguage();

  const getActionName = () => {
    switch (actionType) {
      case 'game':
        return t('welcome.games');
      case 'story':
        return 'Stories';
      case 'battle':
        return t('battle.title');
      default:
        return 'Actions';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl max-w-lg w-full border border-purple-500/20 shadow-2xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-300 to-orange-400 text-transparent bg-clip-text">
            Unlock Unlimited Fun!
          </h2>

          <p className="text-center text-slate-400 mb-6">
            You've used {currentCount} of {limit} free {getActionName().toLowerCase()} today
          </p>

          <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">Premium</span>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-400">$4.99</div>
                <div className="text-sm text-slate-400">per month</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 rounded-full p-1 mt-0.5">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Unlimited Games</div>
                  <div className="text-sm text-slate-400">Play as many educational games as you want</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 rounded-full p-1 mt-0.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Unlimited Story Creation</div>
                  <div className="text-sm text-slate-400">Create endless magical stories</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 rounded-full p-1 mt-0.5">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Unlimited Battles</div>
                  <div className="text-sm text-slate-400">Battle without limits and climb the leaderboard</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-yellow-500/20 rounded-full p-1 mt-0.5">
                  <Crown className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Premium Badge</div>
                  <div className="text-sm text-slate-400">Show off your premium status</div>
                </div>
              </div>
            </div>
          </div>

          <StripeCheckout onSuccess={onClose} onCancel={onClose} />

          <p className="text-center text-xs text-slate-500 mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
