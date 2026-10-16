import React, { useState } from 'react';
import { Users, Plus, Trash2, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

const PALETTE = [
  '#38BDF8', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16', 
  '#14B8A6', '#A855F7', '#EAB308', '#0284C7', '#D946EF'
];

export default function TeamSetup({ teams, setTeams, onProceedToAuction }) {
  const [numTeamsInput, setNumTeamsInput] = useState(teams.length > 0 ? String(teams.length) : '8');
  const [defaultPurse, setDefaultPurse] = useState('100.0');

  // Set number of teams in one click
  const handleSetTeamCount = (e) => {
    e && e.preventDefault();
    const count = parseInt(numTeamsInput, 10);
    if (isNaN(count) || count < 1) return;

    const basePurse = parseFloat(defaultPurse) || 100.0;
    const newTeams = [];

    for (let i = 0; i < count; i++) {
      if (teams[i]) {
        // Keep existing team data if already entered
        newTeams.push({
          ...teams[i],
          initialPurse: teams[i].initialPurse || basePurse
        });
      } else {
        // Create new clean team slot
        const teamNum = i + 1;
        newTeams.push({
          id: 'team_' + Date.now() + '_' + teamNum,
          name: `Team ${teamNum}`,
          shortName: `T${teamNum}`,
          color: PALETTE[i % PALETTE.length],
          initialPurse: basePurse
        });
      }
    }

    setTeams(newTeams);
  };

  // Add a single new team
  const handleAddSingleTeam = () => {
    const nextNum = teams.length + 1;
    const basePurse = parseFloat(defaultPurse) || 100.0;
    const newTeam = {
      id: 'team_' + Date.now() + '_' + nextNum,
      name: `Team ${nextNum}`,
      shortName: `T${nextNum}`,
      color: PALETTE[teams.length % PALETTE.length],
      initialPurse: basePurse
    };
    const updated = [...teams, newTeam];
    setTeams(updated);
    setNumTeamsInput(String(updated.length));
  };

  // Remove a specific team
  const handleRemoveTeam = (teamId) => {
    const updated = teams.filter(t => t.id !== teamId);
    setTeams(updated);
    setNumTeamsInput(String(updated.length));
  };

  // Update a single property of a team
  const handleUpdateTeam = (teamId, field, value) => {
    setTeams(teams.map(t => {
      if (t.id !== teamId) return t;
      if (field === 'initialPurse') {
        return { ...t, initialPurse: parseFloat(value) || 0 };
      }
      if (field === 'shortName') {
        return { ...t, shortName: value.toUpperCase().slice(0, 5) };
      }
      return { ...t, [field]: value };
    }));
  };

  // Apply default purse to all teams
  const handleApplyPurseToAll = () => {
    const p = parseFloat(defaultPurse) || 100.0;
    setTeams(teams.map(t => ({ ...t, initialPurse: p })));
  };

  const handleClearAll = () => {
    if (confirm('Clear all teams and start fresh?')) {
      setTeams([]);
      setNumTeamsInput('0');
    }
  };

  const totalPursePool = teams.reduce((acc, t) => acc + (t.initialPurse || 0), 0);

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Centered Executive Header */}
      <div className="card" style={{ padding: '1.75rem', textAlign: 'center', background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(20,28,48,0.95))' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} />
          <span>AUCTION PRE-FLIGHT SETUP</span>
        </div>
        
        <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
          Set Number of Teams & Details
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.4rem', maxWidth: '580px', margin: '0.4rem auto 0' }}>
          Configure how many teams are participating, enter their names, short codes, and starting purses. Everything saves automatically.
        </p>

        {/* Step 1: Number of Teams Controller (In the Middle) */}
        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
          <form onSubmit={handleSetTeamCount} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap' }}>
                No. of Teams:
              </label>
              <input 
                type="number" 
                min="1" 
                max="24"
                value={numTeamsInput}
                onChange={e => setNumTeamsInput(e.target.value)}
                className="input-text num-mono"
                style={{ width: '75px', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: '#38BDF8', padding: '0.4rem 0.5rem' }}
                placeholder="8"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap' }}>
                Purse per Team:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.9rem' }}>₹</span>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  value={defaultPurse}
                  onChange={e => setDefaultPurse(e.target.value)}
                  className="input-text num-mono"
                  style={{ width: '90px', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: '#FBBF24', padding: '0.4rem 0.5rem' }}
                  placeholder="100.0"
                />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Cr</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.55rem 1.15rem', fontWeight: 700 }}>
              <RefreshCw size={14} />
              <span>Apply Team Slots</span>
            </button>

            {teams.length > 0 && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                style={{ color: '#F87171', fontSize: '0.8rem' }}
                onClick={handleClearAll}
              >
                Clear All
              </button>
            )}

          </form>
        </div>

      </div>

      {/* Team Details Table / List (In the Middle) */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: '#38BDF8' }} />
              <span>Team Details ({teams.length} Teams Configured)</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Type team name, initials, and purse directly in the fields below.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleAddSingleTeam}
              style={{ fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              <span>Add Team</span>
            </button>

            {teams.length > 0 && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleApplyPurseToAll}
                title={`Set all team purses to ₹${defaultPurse} Cr`}
                style={{ fontSize: '0.8rem' }}
              >
                <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                <span>Set All ₹{defaultPurse} Cr</span>
              </button>
            )}
          </div>
        </div>

        {teams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>No teams configured yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Enter the number of teams above and click <strong>Apply Team Slots</strong>, or click <strong>Add Team</strong>.</p>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ marginTop: '1.25rem' }}
              onClick={() => handleSetTeamCount()}
            >
              <Plus size={15} />
              <span>Create 8 Team Slots</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {teams.map((team, idx) => (
              <div 
                key={team.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `4px solid ${team.color}`,
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Index & Color Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  <span className="num-mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)', width: '22px', textAlign: 'center' }}>
                    #{idx + 1}
                  </span>

                  <input 
                    type="color" 
                    value={team.color} 
                    onChange={e => handleUpdateTeam(team.id, 'color', e.target.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: 'none',
                      cursor: 'pointer'
                    }}
                    title="Change team color"
                  />
                </div>

                {/* Team Name */}
                <div style={{ flex: 2, minWidth: '150px' }}>
                  <input 
                    type="text" 
                    className="input-text" 
                    value={team.name}
                    onChange={e => handleUpdateTeam(team.id, 'name', e.target.value)}
                    placeholder="Team Name (e.g. Royal Challengers)"
                    style={{ fontWeight: 700, fontSize: '0.92rem' }}
                  />
                </div>

                {/* Short Code / Initials */}
                <div style={{ width: '85px', flexShrink: 0 }}>
                  <input 
                    type="text" 
                    className="input-text num-mono" 
                    value={team.shortName}
                    onChange={e => handleUpdateTeam(team.id, 'shortName', e.target.value)}
                    placeholder="CODE"
                    maxLength={5}
                    style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.875rem' }}
                    title="Short Code / Initials (e.g. CSK, MI, RCB)"
                  />
                </div>

                {/* Starting Purse */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '120px', flexShrink: 0 }}>
                  <span style={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.85rem' }}>₹</span>
                  <input 
                    type="number" 
                    step="0.5"
                    min="1"
                    className="input-text num-mono" 
                    value={team.initialPurse}
                    onChange={e => handleUpdateTeam(team.id, 'initialPurse', e.target.value)}
                    placeholder="100.0"
                    style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.92rem', color: '#FBBF24' }}
                    title="Starting Purse in ₹ Crores"
                  />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Cr</span>
                </div>

                {/* Delete Button */}
                <button 
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#F87171', padding: '0.35rem', flexShrink: 0 }}
                  onClick={() => handleRemoveTeam(team.id)}
                  title="Remove this team"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            ))}
          </div>
        )}

        {/* Bottom Action Footer (In the Middle) */}
        {teams.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Teams</span>
                <div className="num-mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8' }}>
                  {teams.length}
                </div>
              </div>

              <div style={{ width: 1, height: '24px', background: 'var(--border-subtle)' }} />

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Purse Pool</span>
                <div className="num-mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FBBF24' }}>
                  ₹{totalPursePool.toFixed(1)} Cr
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg"
              onClick={onProceedToAuction}
              style={{ padding: '0.75rem 1.75rem', fontWeight: 800, fontSize: '1rem' }}
            >
              <span>Ready! Proceed to Auction Desk</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
