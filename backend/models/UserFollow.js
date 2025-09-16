import mongoose from 'mongoose';

const userFollowSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower ID is required'],
    index: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following ID is required'],
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate follows
userFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Prevent self-follows with validation
userFollowSchema.pre('save', function(next) {
  if (this.followerId.equals(this.followingId)) {
    const error = new Error('Users cannot follow themselves');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to get leaderboard
userFollowSchema.statics.getLeaderboard = async function(userId, period = 'week', limit = 10) {
  const User = mongoose.model('User');
  const Habit = mongoose.model('Habit');
  const HabitCompletion = mongoose.model('HabitCompletion');
  
  // Get users that the current user follows + current user
  const following = await this.find({ followerId: userId })
    .select('followingId')
    .lean();
  
  const followingIds = following.map(f => f.followingId);
  followingIds.push(new mongoose.Types.ObjectId(userId)); // Include current user
  
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
  
  // Aggregate leaderboard data
  const leaderboard = await User.aggregate([
    {
      $match: { _id: { $in: followingIds } }
    },
    {
      $lookup: {
        from: 'habits',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$isActive', true] }] } } }
        ],
        as: 'habits'
      }
    },
    {
      $lookup: {
        from: 'habitcompletions',
        let: { userId: '$_id' },
        pipeline: [
          { 
            $match: { 
              $expr: { $eq: ['$userId', '$$userId'] },
              ...(Object.keys(dateFilter).length > 0 && { completionDate: dateFilter })
            } 
          }
        ],
        as: 'completions'
      }
    },
    {
      $addFields: {
        totalCompletions: { $size: '$completions' },
        activeHabits: { $size: '$habits' },
        isCurrentUser: { $eq: ['$_id', new mongoose.Types.ObjectId(userId)] }
      }
    },
    {
      $match: { activeHabits: { $gt: 0 } } // Only include users with active habits
    },
    {
      $sort: { totalCompletions: -1, activeHabits: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        username: 1,
        firstName: 1,
        lastName: 1,
        avatarUrl: 1,
        totalCompletions: 1,
        activeHabits: 1,
        isCurrentUser: 1
      }
    }
  ]);
  
  // Add rank to each user
  return leaderboard.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
};

export default mongoose.model('UserFollow', userFollowSchema);

