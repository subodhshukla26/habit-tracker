import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [255, 'Habit name cannot exceed 255 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly'],
    default: 'daily'
  },
  targetCount: {
    type: Number,
    default: 1,
    min: [1, 'Target count must be at least 1'],
    max: [10, 'Target count cannot exceed 10']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate habit names per user
habitSchema.index({ userId: 1, name: 1 }, { unique: true });

// Virtual for habit completions
habitSchema.virtual('completions', {
  ref: 'HabitCompletion',
  localField: '_id',
  foreignField: 'habitId'
});

// Get habit statistics
habitSchema.methods.getStats = async function() {
  const HabitCompletion = mongoose.model('HabitCompletion');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalCompletions, weekCompletions, lastCompletion] = await Promise.all([
    HabitCompletion.countDocuments({ habitId: this._id }),
    HabitCompletion.countDocuments({ 
      habitId: this._id, 
      completionDate: { $gte: weekAgo } 
    }),
    HabitCompletion.findOne({ habitId: this._id })
      .sort({ completionDate: -1 })
      .select('completionDate')
  ]);

  return {
    totalCompletions,
    weekCompletions,
    lastCompletion: lastCompletion?.completionDate
  };
};

// Calculate current streak
habitSchema.methods.getCurrentStreak = async function() {
  const HabitCompletion = mongoose.model('HabitCompletion');
  
  const completions = await HabitCompletion.find({ habitId: this._id })
    .sort({ completionDate: -1 })
    .select('completionDate');

  if (completions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completions.length; i++) {
    const completionDate = new Date(completions[i].completionDate);
    completionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export default mongoose.model('Habit', habitSchema);

