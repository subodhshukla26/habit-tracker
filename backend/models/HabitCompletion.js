import mongoose from 'mongoose';

const habitCompletionSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: [true, 'Habit ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  completionDate: {
    type: Date,
    required: [true, 'Completion date is required'],
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to prevent multiple completions per habit per day
habitCompletionSchema.index({ habitId: 1, completionDate: 1 }, { unique: true });

// Index for user activity queries
habitCompletionSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to normalize completion date (remove time component)
habitCompletionSchema.pre('save', function(next) {
  if (this.completionDate) {
    const date = new Date(this.completionDate);
    date.setHours(0, 0, 0, 0);
    this.completionDate = date;
  }
  next();
});

// Static method to get user activity feed
habitCompletionSchema.statics.getUserActivityFeed = async function(userId, limit = 20, skip = 0) {
  const UserFollow = mongoose.model('UserFollow');
  
  // Get users that the current user follows
  const following = await UserFollow.find({ followerId: userId })
    .select('followingId')
    .lean();
  
  const followingIds = following.map(f => f.followingId);
  
  if (followingIds.length === 0) {
    return [];
  }

  // Get recent completions from followed users
  const feed = await this.aggregate([
    {
      $match: {
        userId: { $in: followingIds },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }
    },
    {
      $lookup: {
        from: 'habits',
        localField: 'habitId',
        foreignField: '_id',
        as: 'habit'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'habit.categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$habit'
    },
    {
      $unwind: '$user'
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        completionDate: 1,
        createdAt: 1,
        notes: 1,
        habit: {
          name: '$habit.name',
          frequency: '$habit.frequency',
          category: {
            $cond: {
              if: '$category',
              then: {
                name: '$category.name',
                color: '$category.color',
                icon: '$category.icon'
              },
              else: null
            }
          }
        },
        user: {
          _id: '$user._id',
          username: '$user.username',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          avatarUrl: '$user.avatarUrl'
        }
      }
    }
  ]);

  return feed;
};

export default mongoose.model('HabitCompletion', habitCompletionSchema);

