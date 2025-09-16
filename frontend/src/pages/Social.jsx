import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { socialAPI } from '../services/api';
import { Users, Search, TrendingUp, Clock, Flame } from 'lucide-react';

const Social = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      const [feedResponse, leaderboardResponse] = await Promise.all([
        socialAPI.getFeed(10),
        socialAPI.getLeaderboard('week', 10)
      ]);
      setFeed(feedResponse.data);
      setLeaderboard(leaderboardResponse.data);
    } catch (error) {
      console.error('Load social data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'feed', name: 'Activity Feed', icon: Clock },
    { id: 'leaderboard', name: 'Leaderboard', icon: TrendingUp },
    { id: 'search', name: 'Find Friends', icon: Search },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Social</h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Activity Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="card text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                <p className="text-gray-500">
                  Follow some friends to see their habit completions here!
                </p>
              </div>
            ) : (
              feed.map(activity => (
                <div key={activity.id} className="card">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-gray-900">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                        {' '}completed{' '}
                        <span className="font-medium text-gray-900">
                          {activity.habit.name}
                        </span>
                        {activity.currentStreak > 1 && (
                          <>
                            {' '}• <span className="text-orange-600 font-medium">
                              {activity.currentStreak} day streak! 🔥
                            </span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(activity.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Leaderboard</h3>
              <div className="space-y-4">
                {leaderboard.map(user => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                      user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {user.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                        {user.isCurrentUser && <span className="text-primary-600"> (You)</span>}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{user.totalCompletions}</span>
                      </div>
                      <p className="text-xs text-gray-500">completions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Friends</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search for users..."
                className="input-field"
              />
            </div>
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>Search for users to follow and see their progress!</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Social;

