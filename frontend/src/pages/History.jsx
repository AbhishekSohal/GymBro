import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function History() {
  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    fetchPastSessions();
    fetchExercisesList();
  }, []);

  const fetchPastSessions = async () => {
    try {
      const data = await api.getPastSessions();
      setPastSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching past sessions:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchExercisesList = async () => {
    try {
      const data = await api.getExercisesList();
      setExercisesList(data || []);
      if (data && data.length > 0) {
        setSelectedExerciseId(data[0].id);
        fetchExerciseChartData(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching exercises list:', err);
    }
  };

  const fetchExerciseChartData = async (exerciseId) => {
    if (!exerciseId) return;
    setLoadingChart(true);
    try {
      const data = await api.getExerciseHistory(exerciseId);
      
      // Transform history data for charting
      // Data format returned by history endpoint: [{ date, weight, reps, set_number }]
      // Group by date to show progress per session
      const groupedByDate = {};
      data.history.forEach((entry) => {
        const dateStr = new Date(entry.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = {
            date: dateStr,
            maxWeight: 0,
            avgWeight: 0,
            count: 0,
            reps: 0
          };
        }
        
        const weight = parseFloat(entry.weight);
        if (weight > groupedByDate[dateStr].maxWeight) {
          groupedByDate[dateStr].maxWeight = weight;
          groupedByDate[dateStr].reps = entry.reps; // Reps corresponding to max weight
        }
        
        groupedByDate[dateStr].avgWeight += weight;
        groupedByDate[dateStr].count += 1;
      });

      const formatted = Object.values(groupedByDate).map(item => ({
        ...item,
        avgWeight: parseFloat((item.avgWeight / item.count).toFixed(1))
      }));

      setChartData(formatted);
    } catch (err) {
      console.error('Error fetching exercise history:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleExerciseChange = (e) => {
    const id = e.target.value;
    setSelectedExerciseId(id);
    fetchExerciseChartData(id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container animate-fade-in">
      <div className="welcome-section">
        <h1 className="welcome-title">Progression & History</h1>
        <p className="welcome-subtitle">Select an exercise to view your strength progress over time.</p>
      </div>

      {/* Exercise Progression Selector */}
      <div className="exercise-select-container">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} /> Choose Exercise
        </label>
        <select 
          className="form-input" 
          value={selectedExerciseId} 
          onChange={handleExerciseChange}
          style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
        >
          {exercisesList.length === 0 && <option value="">No exercises logged yet</option>}
          {exercisesList.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.muscle_group})
            </option>
          ))}
        </select>
      </div>

      {/* Recharts Progression Graph */}
      {selectedExerciseId && (
        <div className="glass-card chart-card" style={{ height: '320px', padding: '16px', display: 'block', marginBottom: '32px' }}>
          {loadingChart ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              Loading progression data...
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center' }}>
              No history found for this exercise yet. <br /> Log some sets in active session mode to render progress.
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text-main)' }}
                    itemStyle={{ color: 'var(--color-primary)' }}
                  />
                  <Legend verticalAlign="top" height={36} fontSize={12} />
                  <Line 
                    name="Max Weight (kg)" 
                    type="monotone" 
                    dataKey="maxWeight" 
                    stroke="var(--color-primary)" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }} 
                    dot={{ strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    name="Avg Weight (kg)" 
                    type="monotone" 
                    dataKey="avgWeight" 
                    stroke="var(--color-accent)" 
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Past Sessions List */}
      <h2 className="history-section-title">Past Gym Sessions</h2>
      {loadingHistory ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading session logs...</p>
      ) : pastSessions.length === 0 ? (
        <div className="glass-card empty-state">
          <Calendar size={48} style={{ marginBottom: '16px', opacity: '0.4' }} />
          <p>No past workout sessions logged.</p>
        </div>
      ) : (
        <div className="session-history-list">
          {pastSessions.map((session) => (
            <div key={session.id} className="glass-card history-card animate-fade-in">
              <div className="history-card-header">
                <span className="history-date">{formatDate(session.date)}</span>
                <span className="history-workout-name">{session.workout_day_name}</span>
              </div>
              
              {session.notes && (
                <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                  "{session.notes}"
                </div>
              )}

              {/* Renders summaries of completed sets */}
              <div className="history-exercises-summary">
                {session.exercises && session.exercises.map((ex, index) => (
                  <div key={index} className="history-exercise-row">
                    <span className="history-ex-name">{ex.name}</span>
                    <span className="history-ex-sets">
                      {ex.sets.map(s => `${s.weight}kg x ${s.reps}`).join(' | ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
