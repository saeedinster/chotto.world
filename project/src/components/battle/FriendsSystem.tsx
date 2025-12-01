import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Swords, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile?: {
    display_name: string;
    trophies: number;
  };
}

interface FriendsSystemProps {
  userId: string;
  onChallengeFriend: (friendId: string) => void;
  onBack: () => void;
}

export function FriendsSystem({ userId, onChallengeFriend, onBack }: FriendsSystemProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
    subscribeFriendUpdates();
  }, [userId]);

  const loadFriends = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        supabase
          .from('battle_friends')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted'),
        supabase
          .from('battle_friends')
          .select('*')
          .eq('friend_id', userId)
          .eq('status', 'pending')
      ]);

      if (friendsRes.data) {
        const friendsWithProfiles = await Promise.all(
          friendsRes.data.map(async (f) => {
            const friendUserId = f.user_id === userId ? f.friend_id : f.user_id;
            const [profile, stats] = await Promise.all([
              supabase.from('user_profiles').select('display_name').eq('id', friendUserId).maybeSingle(),
              supabase.from('player_battle_stats').select('trophies').eq('user_id', friendUserId).maybeSingle()
            ]);

            return {
              ...f,
              friend_profile: {
                display_name: profile?.data?.display_name || 'Player',
                trophies: stats?.data?.trophies || 0
              }
            };
          })
        );
        setFriends(friendsWithProfiles);
      }

      if (requestsRes.data) {
        const requestsWithProfiles = await Promise.all(
          requestsRes.data.map(async (r) => {
            const [profile, stats] = await Promise.all([
              supabase.from('user_profiles').select('display_name').eq('id', r.user_id).maybeSingle(),
              supabase.from('player_battle_stats').select('trophies').eq('user_id', r.user_id).maybeSingle()
            ]);

            return {
              ...r,
              friend_profile: {
                display_name: profile?.data?.display_name || 'Player',
                trophies: stats?.data?.trophies || 0
              }
            };
          })
        );
        setPendingRequests(requestsWithProfiles);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeFriendUpdates = () => {
    const channel = supabase
      .channel('friends-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_friends',
          filter: `friend_id=eq.${userId}`
        },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const searchUser = async () => {
    setError(null);
    setSearchResult(null);

    if (!searchEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, display_name, email')
        .eq('email', searchEmail.toLowerCase().trim())
        .maybeSingle();

      if (!profile) {
        setError('User not found');
        return;
      }

      if (profile.id === userId) {
        setError('You cannot add yourself as a friend');
        return;
      }

      const { data: existing } = await supabase
        .from('battle_friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${userId})`)
        .maybeSingle();

      if (existing) {
        setError('Friend request already exists or you are already friends');
        return;
      }

      const { data: stats } = await supabase
        .from('player_battle_stats')
        .select('trophies')
        .eq('user_id', profile.id)
        .maybeSingle();

      setSearchResult({
        ...profile,
        trophies: stats?.trophies || 0
      });
    } catch (err) {
      console.error('Error searching user:', err);
      setError('Error searching for user');
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      await supabase.from('battle_friends').insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });

      setSearchResult(null);
      setSearchEmail('');
      alert('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Error sending friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await supabase
        .from('battle_friends')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', requestId);

      loadFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await supabase.from('battle_friends').delete().eq('id', requestId);
      loadFriends();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await supabase.from('battle_friends').delete().eq('id', friendshipId);
      loadFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold">Friends</h1>
          </div>

          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <UserPlus size={20} />
              Add Friend
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                placeholder="Enter friend's email"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 outline-none"
              />
              <button
                onClick={searchUser}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
              >
                <Search size={20} />
                Search
              </button>
            </div>

            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}

            {searchResult && (
              <div className="mt-3 bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold">{searchResult.display_name}</div>
                  <div className="text-sm text-gray-600">{searchResult.trophies} 🏆</div>
                </div>
                <button
                  onClick={() => sendFriendRequest(searchResult.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                >
                  Send Request
                </button>
              </div>
            )}
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Pending Requests ({pendingRequests.length})</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{request.friend_profile?.display_name}</div>
                    <div className="text-sm text-gray-600">{request.friend_profile?.trophies} 🏆</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Your Friends ({friends.length})</h2>

          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>No friends yet. Add some friends to battle together!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friendship) => {
                const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;

                return (
                  <div key={friendship.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{friendship.friend_profile?.display_name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>🏆 {friendship.friend_profile?.trophies} Trophies</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onChallengeFriend(friendId)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <Swords size={20} />
                        Challenge
                      </button>
                      <button
                        onClick={() => removeFriend(friendship.id)}
                        className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 mt-6 text-white shadow-lg text-center">
          <h3 className="text-2xl font-bold mb-2">Play with Friends!</h3>
          <p className="opacity-90">
            Challenge your friends to epic battles and see who's the best!
          </p>
        </div>
      </div>
    </div>
  );
}
