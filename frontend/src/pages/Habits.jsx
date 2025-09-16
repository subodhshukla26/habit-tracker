import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { habitsAPI } from '../services/api';
import { Plus, Edit, Trash2, Target, Calendar, X, Hash } from 'lucide-react';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await habitsAPI.getHabits();
      setHabits(response.data);
    } catch (error) {
      console.error('Load habits error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">My Habits</h1>
          <button
            className="btn-primary flex items-center space-x-2"
            onClick={() => setEditingHabit({})} // empty object for "add new"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Habit</span>
          </button>
        </div>

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="card-glass text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No habits yet</h3>
            <p className="text-gray-300 mb-6">
              Create your first habit to start tracking your progress.
            </p>
            <button className="btn-primary" onClick={() => setEditingHabit({})}>
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <div key={habit.id} className="habit-card">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-white">{habit.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-1 text-gray-400 hover:text-white"
                      onClick={() => setEditingHabit(habit)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-400"
                      onClick={() => setDeletingHabit(habit)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {habit.description && (
                  <p className="text-gray-300 text-sm mb-4">{habit.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300 capitalize">{habit.frequency}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {habit.stats.totalCompletions} completions
                    </p>
                    <p className="text-xs text-gray-400">
                      {habit.stats.weekCompletions} this week
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit / Add Habit Modal */}
        {editingHabit && (
          <EditHabitModal
            habit={editingHabit}
            onClose={() => setEditingHabit(null)}
            onHabitUpdated={loadHabits}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingHabit && (
          <DeleteHabitModal
            habit={deletingHabit}
            onClose={() => setDeletingHabit(null)}
            onHabitDeleted={loadHabits}
          />
        )}
      </div>
    </Layout>
  );
};

export default Habits;

/* ------------------------ EditHabitModal ------------------------ */
const EditHabitModal = ({ habit, onClose, onHabitUpdated }) => {
  const isNew = !habit.id;
  const [formData, setFormData] = useState({
    name: habit.name || '',
    description: habit.description || '',
    frequency: habit.frequency || 'daily',
    targetCount: habit.targetCount || 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Habit name is required';
    if (formData.targetCount < 1 || formData.targetCount > 10)
      newErrors.targetCount = 'Target count must be between 1 and 10';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isNew) {
        await habitsAPI.createHabit(formData);
      } else {
        await habitsAPI.updateHabit(habit.id, formData);
      }
      onClose();
      onHabitUpdated();
    } catch (error) {
      console.error('Failed to save habit:', error);
      setErrors({ general: error.response?.data?.error || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-lg card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{isNew ? 'Create Habit' : 'Edit Habit'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && <p className="text-red-400">{errors.general}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
                <select name="frequency" value={formData.frequency} onChange={handleChange} className="input-field">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Count</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="targetCount"
                    value={formData.targetCount}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.targetCount ? 'border-red-500' : ''}`}
                    min={1}
                    max={10}
                  />
                </div>
                {errors.targetCount && <p className="text-red-400 text-xs mt-1">{errors.targetCount}</p>}
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isNew ? 'Create Habit' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ------------------------ DeleteHabitModal ------------------------ */
const DeleteHabitModal = ({ habit, onClose, onHabitDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await habitsAPI.deleteHabit(habit.id);
      onClose();
      onHabitDeleted();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card-glass p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Delete Habit</h2>
        <p className="text-gray-300 mb-6">Are you sure you want to delete <strong>{habit.name}</strong>?</p>
        <div className="flex justify-center space-x-4">
          <button className="btn-red flex-1" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn-ghost flex-1" onClick={onClose} disabled={isDeleting}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
