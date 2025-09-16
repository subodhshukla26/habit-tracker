import express from 'express';
import { Category, Habit, HabitCompletion } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateHabit } from '../middleware/validation.js';

const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's habits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const habits = await Habit.find({
      userId: req.user.id,
      isActive: active === 'true'
    })
    .populate('categoryId')
    .sort({ createdAt: -1 });

    // Get stats for each habit
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const stats = await habit.getStats();
        return {
          id: habit._id,
          name: habit.name,
          description: habit.description,
          frequency: habit.frequency,
          targetCount: habit.targetCount,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          updatedAt: habit.updatedAt,
          category: habit.categoryId ? {
            name: habit.categoryId.name,
            color: habit.categoryId.color,
            icon: habit.categoryId.icon
          } : null,
          stats
        };
      })
    );

    res.json(habitsWithStats);
  } catch (error) {
    console.error('Habits fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single habit with detailed stats
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    
    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user.id
    }).populate('categoryId');

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Get completion history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completions = await HabitCompletion.find({
      habitId: habitId,
      completionDate: { $gte: thirtyDaysAgo }
    })
    .select('completionDate notes')
    .sort({ completionDate: -1 });

    // Calculate current streak
    const currentStreak = await habit.getCurrentStreak();

    res.json({
      id: habit._id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      isActive: habit.isActive,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      category: habit.categoryId ? {
        name: habit.categoryId.name,
        color: habit.categoryId.color,
        icon: habit.categoryId.icon
      } : null,
      completions: completions.map(c => ({
        completionDate: c.completionDate,
        notes: c.notes
      })),
      currentStreak
    });
  } catch (error) {
    console.error('Habit fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new habit
router.post('/', authenticateToken, validateHabit, async (req, res) => {
  try {
    const { name, description, frequency, targetCount, categoryId } = req.body;

    // Check for duplicate habit name for this user
    const existingHabit = await Habit.findOne({
      userId: req.user.id,
      name: name,
      isActive: true
    });

    if (existingHabit) {
      return res.status(409).json({ 
        error: 'You already have an active habit with this name' 
      });
    }

    const habit = new Habit({
      userId: req.user.id,
      name,
      description,
      frequency,
      targetCount: targetCount || 1,
      categoryId: categoryId || null
    });

    await habit.save();

    res.status(201).json({
      message: 'Habit created successfully',
      habit: {
        id: habit._id,
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        isActive: habit.isActive,
        createdAt: habit.createdAt
      }
    });
  } catch (error) {
    console.error('Habit creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ errors });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update habit
router.put('/:id', authenticateToken, validateHabit, async (req, res) => {
  try {
    const habitId = req.params.id;
    const { name, description, frequency, targetCount, categoryId, isActive } = req.body;

    // Check ownership
    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user.id
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check for duplicate name (excluding current habit)
    const duplicateHabit = await Habit.findOne({
      userId: req.user.id,
      name: name,
      _id: { $ne: habitId },
      isActive: true
    });

    if (duplicateHabit) {
      return res.status(409).json({ 
        error: 'You already have an active habit with this name' 
      });
    }

    // Update habit
    habit.name = name;
    habit.description = description;
    habit.frequency = frequency;
    habit.targetCount = targetCount || 1;
    habit.categoryId = categoryId || null;
    if (isActive !== undefined) {
      habit.isActive = isActive;
    }

    await habit.save();

    res.json({
      message: 'Habit updated successfully',
      habit: {
        id: habit._id,
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        isActive: habit.isActive,
        updatedAt: habit.updatedAt
      }
    });
  } catch (error) {
    console.error('Habit update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ errors });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete habit (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;

    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Habit deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check in habit (mark as completed)
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    const { notes, date } = req.body;
    const completionDate = date ? new Date(date) : new Date();
    completionDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Verify habit ownership
    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user.id,
      isActive: true
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check for existing completion on this date
    const existingCompletion = await HabitCompletion.findOne({
      habitId: habitId,
      completionDate: completionDate
    });

    if (existingCompletion) {
      return res.status(409).json({ 
        error: 'Habit already completed for this date' 
      });
    }

    // Create completion record
    const completion = new HabitCompletion({
      habitId: habitId,
      userId: req.user.id,
      completionDate: completionDate,
      notes: notes || null
    });

    await completion.save();

    res.status(201).json({
      message: 'Habit checked in successfully',
      completion: {
        id: completion._id,
        completionDate: completion.completionDate,
        completedAt: completion.createdAt,
        notes: completion.notes
      }
    });
  } catch (error) {
    console.error('Habit checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove check-in
router.delete('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    const { date } = req.query;
    const completionDate = new Date(date || new Date());
    completionDate.setHours(0, 0, 0, 0);

    const result = await HabitCompletion.deleteOne({
      habitId: habitId,
      userId: req.user.id,
      completionDate: completionDate
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No completion found for this date' });
    }

    res.json({ message: 'Check-in removed successfully' });
  } catch (error) {
    console.error('Checkin removal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;