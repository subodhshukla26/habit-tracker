import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import HabitModal from '../components/HabitModal';
import { habitsAPI, socialAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Target, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Circle,
  Flame,
  Award,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    currentStreak: 0,
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState({});
  const [showHabitModal, setShowHabitModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [habitsResponse, activityResponse] = await Promise.all([
        habitsAPI.getHabits(true),
        socialAPI.getFeed(5)
      ]);

      const habitsData = habitsResponse.data;
      setHabits(habitsData);
      setRecentActivity(activityResponse.data);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const completedToday = habitsData.filter(habit => 
        habit.stats.lastCompletion === today
      ).length;

      const totalCompletions = habitsData.reduce((sum, habit) => 
        sum + habit.stats.weekCompletions, 0
      );

      const maxPossibleCompletions = habitsData.length * 7; // Assuming daily habits
      const weeklyProgress = maxPossibleCompletions > 0 
        ? Math.round((totalCompletions / maxPossibleCompletions) * 100)
        : 0;

      setStats({
        totalHabits: habitsData.length,
        completedToday,
        currentStreak: Math.max(...habitsData.map(h => h.stats.weekCompletions), 0),
        weeklyProgress
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (habitId) => {
    try {
      setCheckingIn(prev => ({ ...prev, [habitId]: true }));
      
      await habitsAPI.checkinHabit(habitId);
      
      // Reload habits to update the UI
      loadDashboardData();
    } catch (error) {
      console.error('Checkin error:', error);
      // TODO: Show error message to user
    } finally {
      setCheckingIn(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const handleRemoveCheckin = async (habitId) => {
    try {
      setCheckingIn(prev => ({ ...prev, [habitId]: true }));
      
      const today = new Date().toISOString().split('T')[0];
      await habitsAPI.removeCheckin(habitId, today);
      
      // Reload habits to update the UI
      loadDashboardData();
    } catch (error) {
      console.error('Remove checkin error:', error);
      // TODO: Show error message to user
    } finally {
      setCheckingIn(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.stats.lastCompletion === today;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleHabitCreated = (newHabit) => {
    // Add the new habit to the list
    setHabits(prev => [newHabit, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalHabits: prev.totalHabits + 1
    }));
    
    setShowHabitModal(false);
  };

  const openHabitModal = () => {
    setShowHabitModal(true);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'white' }) => (
    <div className="stat-card">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-300 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const HabitCard = ({ habit }) => {
    const completed = isCompletedToday(habit);
    const isLoading = checkingIn[habit.id];

    return (
      <div className="habit-card hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => completed ? handleRemoveCheckin(habit.id) : handleCheckin(habit.id)}
              disabled={isLoading}
              className={`p-2 rounded-full transition-all duration-200 ${
                completed 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white border border-gray-600'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
              ) : completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            
            <div>
              <h3 className={`font-medium ${completed ? 'text-green-700' : 'text-gray-900'}`}>
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {habit.category && (
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: habit.category.color + '20',
                      color: habit.category.color 
                    }}
                  >
                    {habit.category.name}
                  </span>
                )}
                <span className="text-xs text-gray-500 capitalize">
                  {habit.frequency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-gray-900">
                  {habit.stats.weekCompletions}
                </span>
              </div>
              <p className="text-xs">This week</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">
                  {habit.stats.totalCompletions}
                </span>
              </div>
              <p className="text-xs">Total</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="card-glass welcome-gradient text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                {getGreeting()}, {user?.firstName}! 👋
              </h1>
              <p className="mt-3 text-gray-300 text-lg">
                You have {stats.totalHabits} active habits. 
                {stats.completedToday > 0 
                  ? ` Great job completing ${stats.completedToday} today!`
                  : ' Let\'s start building those habits!'
                }
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <p className="text-4xl font-bold gradient-accent">{stats.completedToday}/{stats.totalHabits}</p>
                <p className="text-gray-400 text-sm uppercase tracking-wide">completed today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Target}
            title="Active Habits"
            value={stats.totalHabits}
            subtitle="habits being tracked"
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="Completed Today"
            value={stats.completedToday}
            subtitle={`out of ${stats.totalHabits} habits`}
            color="green"
          />
          <StatCard
            icon={Flame}
            title="Weekly Progress"
            value={`${stats.weeklyProgress}%`}
            subtitle="of weekly goals"
            color="orange"
          />
          <StatCard
            icon={Award}
            title="Best Streak"
            value={stats.currentStreak}
            subtitle="completions this week"
            color="purple"
          />
        </div>

        {/* Today's Habits */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Today's Habits</h2>
            <button 
              onClick={openHabitModal}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Habit</span>
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="card text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No habits yet</h3>
              <p className="text-gray-400 mb-6">
                Start building better habits by creating your first habit tracker.
              </p>
              <button 
                onClick={openHabitModal}
                className="btn-primary"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        {recentActivity.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map(activity => (
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
                        {activity.habit.category && (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: activity.habit.category.color + '20',
                              color: activity.habit.category.color 
                            }}
                          >
                            {activity.habit.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Habit Creation Modal */}
      <HabitModal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        onHabitCreated={handleHabitCreated}
      />
    </Layout>
  );
};

export default Dashboard;
