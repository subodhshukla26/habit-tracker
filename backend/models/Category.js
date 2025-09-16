import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color code']
  },
  icon: {
    type: String,
    default: 'target',
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Create default categories
categorySchema.statics.createDefaults = async function() {
  const defaultCategories = [
    { name: 'Health & Fitness', color: '#EF4444', icon: 'heart' },
    { name: 'Learning', color: '#3B82F6', icon: 'book' },
    { name: 'Productivity', color: '#10B981', icon: 'zap' },
    { name: 'Mindfulness', color: '#8B5CF6', icon: 'brain' },
    { name: 'Social', color: '#F59E0B', icon: 'users' },
    { name: 'Hobbies', color: '#EC4899', icon: 'palette' },
    { name: 'Finance', color: '#059669', icon: 'dollar-sign' },
    { name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
  ];

  for (const category of defaultCategories) {
    await this.findOneAndUpdate(
      { name: category.name },
      category,
      { upsert: true, new: true }
    );
  }
};

export default mongoose.model('Category', categorySchema);

