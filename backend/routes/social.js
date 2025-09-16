import express from 'express';
import { User, Habit, HabitCompletion, UserFollow } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/users/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ]
    })
    .select('username firstName lastName avatarUrl')
    .limit(parseInt(limit));

    // Check which users are already being followed
    const following = await UserFollow.find({
      followerId: req.user.id,
      followingId: { $in: users.map(u => u._id) }
    });

    const followingIds = following.map(f => f.followingId.toString());

    const usersWithFollowStatus = users.map(user => ({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isFollowing: followingIds.includes(user._id.toString())
    }));

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's following list
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const following = await UserFollow.find({ followerId: req.user.id })
      .populate('followingId', 'username firstName lastName avatarUrl')
      .sort({ createdAt: -1 });

    const followingList = following.map(follow => ({
      id: follow.followingId._id,
      username: follow.followingId.username,
      firstName: follow.followingId.firstName,
      lastName: follow.followingId.lastName,
      avatarUrl: follow.followingId.avatarUrl,
      followedAt: follow.createdAt
    }));

    res.json(followingList);
  } catch (error) {
    console.error('Following list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's followers list
router.get('/followers', authenticateToken, async (req, res) => {
  try {
    const followers = await UserFollow.find({ followingId: req.user.id })
      .populate('followerId', 'username firstName lastName avatarUrl')
      .sort({ createdAt: -1 });

    // Check which followers are being followed back
    const followingBack = await UserFollow.find({
      followerId: req.user.id,
      followingId: { $in: followers.map(f => f.followerId._id) }
    });

    const followingBackIds = followingBack.map(f => f.followingId.toString());

    const followersList = followers.map(follow => ({
      id: follow.followerId._id,
      username: follow.followerId.username,
      firstName: follow.followerId.firstName,
      lastName: follow.followerId.lastName,
      avatarUrl: follow.followerId.avatarUrl,
      followedAt: follow.createdAt,
      isFollowingBack: followingBackIds.includes(follow.followerId._id.toString())
    }));

    res.json(followersList);
  } catch (error) {
    console.error('Followers list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow a user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const followingId = req.params.userId;
    const followerId = req.user.id;

    // Prevent self-follow
    if (followingId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if user exists
    const userExists = await User.findById(followingId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await UserFollow.findOne({
      followerId,
      followingId
    });

    if (existingFollow) {
      return res.status(409).json({ error: 'You are already following this user' });
    }

    // Create follow relationship
    await UserFollow.create({ followerId, followingId });

    res.status(201).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const followingId = req.params.userId;
    const followerId = req.user.id;

    const result = await UserFollow.deleteOne({
      followerId,
      followingId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity feed (friends' recent activities)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get users being followed
    const following = await UserFollow.find({ followerId: req.user.id })
      .select('followingId');
    
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json([]);
    }

    // Get recent completions from followed users
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completions = await HabitCompletion.find({
      userId: { $in: followingIds },
      createdAt: { $gte: weekAgo }
    })
    .populate('userId', 'username firstName lastName avatarUrl')
    .populate({
      path: 'habitId',
      select: 'name frequency categoryId',
      populate: {
        path: 'categoryId',
        select: 'name color icon'
      }
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));

    const activities = completions.map(completion => ({
      id: completion._id,
      completionDate: completion.completionDate,
      completedAt: completion.createdAt,
      notes: completion.notes,
      habit: {
        name: completion.habitId.name,
        frequency: completion.habitId.frequency,
        category: completion.habitId.categoryId ? {
          name: completion.habitId.categoryId.name,
          color: completion.habitId.categoryId.color,
          icon: completion.habitId.categoryId.icon
        } : null
      },
      user: {
        id: completion.userId._id,
        username: completion.userId.username,
        firstName: completion.userId.firstName,
        lastName: completion.userId.lastName,
        avatarUrl: completion.userId.avatarUrl
      }
    }));

    res.json(activities);
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard (top users by completions)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;
    
    // Get users being followed + current user
    const following = await UserFollow.find({ followerId: req.user.id })
      .select('followingId');
    
    const followingIds = following.map(f => f.followingId);
    followingIds.push(req.user.id); // Include current user

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }

    // Get users with their completion counts
    const users = await User.find({ _id: { $in: followingIds } })
      .select('username firstName lastName avatarUrl');

    const leaderboard = [];

    for (const user of users) {
      // Count active habits
      const activeHabits = await Habit.countDocuments({
        userId: user._id,
        isActive: true
      });

      // Count completions in period
      const completionFilter = {
        userId: user._id,
        ...(Object.keys(dateFilter).length > 0 && { completionDate: dateFilter })
      };

      const totalCompletions = await HabitCompletion.countDocuments(completionFilter);

      if (activeHabits > 0) {
        leaderboard.push({
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          totalCompletions,
          activeHabits,
          isCurrentUser: user._id.toString() === req.user.id
        });
      }
    }

    // Sort by completions and add rank
    leaderboard.sort((a, b) => b.totalCompletions - a.totalCompletions);
    
    const rankedLeaderboard = leaderboard
      .slice(0, parseInt(limit))
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;