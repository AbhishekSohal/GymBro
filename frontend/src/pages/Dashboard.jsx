import React, { useState, useEffect } from 'react';
import { Play, Plus, Dumbbell, Calendar, BarChart2, PlusCircle, Check } from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard({ user, onStartSession }) {
  const [workoutDays, setWorkoutDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  
  // Quick templates adding modal
  const [selectedDayForExercises, setSelectedDayForExercises] = useState(null);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscle, setExerciseMuscle] = useState('');

  useEffect(() => {
    fetchWorkoutDays();
  }, []);

  const fetchWorkoutDays = async () => {
    try {
      const data = await api.getWorkoutDays();
      setWorkoutDays(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDay = async (e) => {
    e.preventDefault();
    if (!newDayName.trim()) return;

    try {
      await api.createWorkoutDay(newDayName);
      setNewDayName('');
      setShowAddForm(false);
      fetchWorkoutDays();
    } catch (err) {
      alert(err.message || 'Error creating day template');
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim() || !selectedDayForExercises) return;

    try {
      await api.addExerciseToDay(
        selectedDayForExercises.id,
        exerciseName.trim(),
        exerciseMuscle.trim() || 'General'
      );
      setExerciseName('');
      setExerciseMuscle('');
      
      // Refresh days
      fetchWorkoutDays();
      
      // Update selected day list
      const updated = await api.getWorkoutDays();
      const updatedDay = updated.find(d => d.id === selectedDayForExercises.id);
      setSelectedDayForExercises(updatedDay);
    } catch (err) {
      alert(err.message || 'Error adding exercise');
    }
  };

  const handleStart = async (dayId) => {
    try {
      const sessionData = await api.startSession(dayId);
      onStartSession(sessionData.session.id, sessionData.session.workout_day_name);
    } catch (err) {
      alert('Could not start workout: ' + err.message);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, {user?.name || 'Champ'}!</h1>
        <p className="welcome-subtitle">Select a template to start lifting or customize your splits.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Your Workout Days</h2>
        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateDay} className="glass-card animate-fade-in" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Push Day 2, Upper Split"
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>Save</button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '20px' }}>Loading templates...</p>
      ) : workoutDays.length === 0 ? (
        <div className="glass-card empty-state">
          <Dumbbell size={48} style={{ marginBottom: '16px', opacity: '0.4' }} />
          <p>No workout templates created yet.</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Click "New Template" to configure your split.</p>
        </div>
      ) : (
        <div className="workout-templates-grid">
          {workoutDays.map((day) => (
            <div key={day.id} className="workout-template-item">
              <div className="glass-card template-card" onClick={() => handleStart(day.id)}>
                <div className="template-info">
                  <span className="template-name">{day.name}</span>
                  <span className="template-exercises-count">
                    {day.exercise_count || 0} exercises configured
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayForExercises(selectedDayForExercises?.id === day.id ? null : day);
                    }}
                  >
                    Edit List
                  </button>
                  <div className="start-icon" style={{ background: 'var(--color-primary-glow)', padding: '10px', borderRadius: '50%' }}>
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Exercises Manager inside Template dropdown */}
              {selectedDayForExercises?.id === day.id && (
                <div className="glass-card animate-fade-in" style={{ marginTop: '8px', padding: '16px', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0, background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-accent)' }}>
                    Configure Exercises for {day.name}
                  </h3>
                  
                  {/* Current Exercises List */}
                  {day.exercises && day.exercises.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {day.exercises.map((ex, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px' }}>
                          <span style={{ fontWeight: '600' }}>{ex.name}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{ex.muscle_group}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>No exercises configured yet.</p>
                  )}

                  {/* Add Exercise Inline Form */}
                  <form onSubmit={handleAddExercise} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '14px' }}
                      placeholder="Exercise (e.g. Incline Bench)"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '14px' }}
                      placeholder="Muscle Group (e.g. upper chest)"
                      value={exerciseMuscle}
                      onChange={(e) => setExerciseMuscle(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                      <Plus size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
