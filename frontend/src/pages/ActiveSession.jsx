import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, CheckCircle2, ChevronLeft, Save } from 'lucide-react';
import { api } from '../utils/api';

export default function ActiveSession({ sessionId, workoutDayName, onCancel, onFinish }) {
  const [exercises, setExercises] = useState([]);
  const [lastValues, setLastValues] = useState({}); // Stores historical values: { [exerciseId]: [{ weight, reps }, ...] }
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      // 1. Fetch current session configurations
      const sessionData = await api.getSession(sessionId);
      
      // 2. Fetch last logged values for placeholders
      const lastData = await api.getLastValues(sessionId);
      setLastValues(lastData.lastValues || {});

      // 3. Initialize sets state
      // If current session already has saved sets (resuming), map them. Otherwise, initialize default sets
      const initializedExercises = sessionData.exercises.map((ex) => {
        const lastExValues = lastData.lastValues?.[ex.id] || [];
        
        // If server already has saved set entries for this exercise, use them
        if (ex.sets && ex.sets.length > 0) {
          return {
            ...ex,
            sets: ex.sets.map(s => ({
              set_number: s.set_number,
              weight: s.weight,
              reps: s.reps,
              completed: s.completed
            }))
          };
        }

        // Otherwise, initialize sets based on previous session's sets count or default to 3
        const defaultSetsCount = lastExValues.length > 0 ? lastExValues.length : 3;
        const initialSets = [];
        for (let i = 1; i <= defaultSetsCount; i++) {
          initialSets.push({
            set_number: i,
            weight: '', // Empty initially, placeholder will show previous values
            reps: '',
            completed: false
          });
        }
        return {
          ...ex,
          sets: initialSets
        };
      });

      setExercises(initializedExercises);
    } catch (err) {
      console.error('Error fetching session info:', err);
      alert('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const handleToggleCompleted = async (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    // Toggle completion status
    const targetCompleted = !set.completed;
    
    // Fallback/Autofill defaults if values are empty:
    // We check: 
    // 1. If user typed a value, use it.
    // 2. If empty, check if we have previous values.
    // 3. Otherwise, use standard default values (e.g. 10 kg, 10 reps)
    let finalWeight = set.weight;
    let finalReps = set.reps;

    const previousSets = lastValues[exercise.id] || [];
    const prevSet = previousSets[setIndex] || previousSets[previousSets.length - 1]; // Fallback to last known set if sets expanded

    if (!finalWeight || isNaN(finalWeight)) {
      finalWeight = prevSet ? prevSet.weight : 10;
    }
    if (!finalReps || isNaN(finalReps)) {
      finalReps = prevSet ? prevSet.reps : 10;
    }

    // Update state
    set.weight = finalWeight;
    set.reps = finalReps;
    set.completed = targetCompleted;
    setExercises(updated);

    try {
      // Save changes immediately to backend
      await api.saveSet(
        sessionId,
        exercise.id,
        set.set_number,
        parseFloat(finalWeight),
        parseInt(finalReps),
        targetCompleted
      );
    } catch (err) {
      // Revert status on failure
      set.completed = !targetCompleted;
      setExercises(updated);
      alert('Failed to save set: ' + err.message);
    }
  };

  const handleAddSet = (exerciseIndex) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;
    
    exercise.sets.push({
      set_number: newSetNumber,
      weight: '',
      reps: '',
      completed: false
    });
    setExercises(updated);
  };

  const handleRemoveSet = async (exerciseIndex) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    if (exercise.sets.length <= 1) return;
    
    const removedSet = exercise.sets.pop();
    setExercises(updated);

    // If the removed set was already saved (completed), delete it from backend by sending completed = false (or API handles cleanup)
    if (removedSet.completed) {
      try {
        await api.saveSet(sessionId, exercise.id, removedSet.set_number, 0, 0, false);
      } catch (err) {
        console.error('Error removing set from DB:', err);
      }
    }
  };

  const handleFinishWorkout = async () => {
    setFinishing(true);
    try {
      await api.finishSession(sessionId, notes);
      onFinish();
    } catch (err) {
      alert('Could not finish workout: ' + err.message);
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Preparing your workout session...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '120px' }}>
      <div className="session-header">
        <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={onCancel}>
          <ChevronLeft size={18} /> Cancel
        </button>
        <span style={{ fontWeight: '800', color: 'var(--color-accent)' }}>ACTIVE WORKOUT</span>
      </div>

      <div className="welcome-section">
        <h1 className="session-title">{workoutDayName}</h1>
        <p className="welcome-subtitle">Tap the checkmark to save each set instantly. Light gray values are your previous numbers.</p>
      </div>

      <div className="exercise-list">
        {exercises.map((ex, exIdx) => {
          const prevValues = lastValues[ex.id] || [];
          return (
            <div key={ex.id} className="glass-card exercise-card">
              <div className="exercise-header">
                <span className="exercise-name">{ex.name}</span>
                <div className="exercise-muscle">{ex.muscle_group}</div>
              </div>

              <div className="sets-header">
                <span>Set</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
                <span>Done</span>
              </div>

              {ex.sets.map((set, setIdx) => {
                const prevSet = prevValues[setIdx] || prevValues[prevValues.length - 1];
                const placeholderWeight = prevSet ? prevSet.weight : '10';
                const placeholderReps = prevSet ? prevSet.reps : '10';

                return (
                  <div key={setIdx} className={`set-row ${set.completed ? 'completed' : ''}`}>
                    <div className="set-number">{set.set_number}</div>
                    
                    <div className="input-container">
                      <input
                        type="number"
                        pattern="[0-9]*"
                        inputMode="decimal"
                        className="set-input"
                        placeholder={placeholderWeight}
                        value={set.weight}
                        onChange={(e) => handleSetChange(exIdx, setIdx, 'weight', e.target.value)}
                        disabled={set.completed}
                      />
                      <span className="input-unit">kg</span>
                    </div>

                    <div className="input-container">
                      <input
                        type="number"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="set-input"
                        placeholder={placeholderReps}
                        value={set.reps}
                        onChange={(e) => handleSetChange(exIdx, setIdx, 'reps', e.target.value)}
                        disabled={set.completed}
                      />
                      <span className="input-unit">reps</span>
                    </div>

                    <div>
                      <button
                        className={`checkmark-btn ${set.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleCompleted(exIdx, setIdx)}
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="exercise-actions">
                <button className="exercise-action-btn" onClick={() => handleAddSet(exIdx)}>
                  <Plus size={14} /> Add Set
                </button>
                {ex.sets.length > 1 && (
                  <button className="exercise-action-btn" style={{ color: '#ef4444' }} onClick={() => handleRemoveSet(exIdx)}>
                    <Trash2 size={14} /> Remove Set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finishing Panel */}
      <div className="glass-card" style={{ padding: '20px', position: 'fixed', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', borderRadius: '16px 16px 0 0', borderBottom: 'none', background: 'rgba(9, 11, 17, 0.95)', backdropFilter: 'blur(20px)', borderTopColor: 'var(--color-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            className="form-input"
            style={{ height: '50px', resize: 'none', fontSize: '14px' }}
            placeholder="Add optional notes (e.g. felt strong, shoulder fatigue...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleFinishWorkout} disabled={finishing}>
            <Save size={18} /> {finishing ? 'Saving Workout...' : 'Finish Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
