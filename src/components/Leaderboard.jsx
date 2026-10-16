import React, { useState } from 'react';
import { Trophy, Download, LayoutGrid, Table, ArrowUpDown, Shield, Users, Trash2, ExternalLink } from 'lucide-react';

export default function Leaderboard({ teams, getTeamStats, onSelectTeam, onUndoSale, onFocusPlayer }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' is default side-by-side as requested!
  const [sortBy, setSortBy] = useState('points_desc'); // 'points_desc', 'purse_desc', 'squad_desc'

  const teamsWithStats = teams.map(t => getTeamStats(t.id));

  // Sort teams according to selected criteria
  teamsWithStats.sort((a, b) => {
    if (sortBy === 'purse_desc') {
      return b.purseRemaining - a.purseRemaining || b.totalPoints - a.totalPoints;
    }
    if (sortBy === 'squad_desc') {
      return b.squadCount - a.squadCount || b.totalPoints - a.totalPoints;
    }
    // Default: Total Omni Points descending, then remaining purse
    return b.totalPoints - a.totalPoints || b.purseRemaining - a.purseRemaining;
  });

  const exportCSV = () => {
    let csv = "Rank,Team,Players,Omni_Points,Initial_Purse_Cr,Spent_Cr,Remaining_Cr,Pts_Per_Cr,Top_Scorer\n";
    teamsWithStats.forEach((st, idx) => {
      const topP = st.squad.length > 0 ? [...st.squad].sort((a, b) => b.points - a.points)[0] : null;
      const ptsPerCr = st.purseSpent > 0 ? (st.totalPoints / st.purseSpent).toFixed(1) : '0';
      const topPName = topP ? `#${topP.overallRank} ${topP.name}` : '-';
      csv += `${idx + 1},"${st.team.name}",${st.squadCount},${st.totalPoints},${st.initialPurse},${st.purseSpent},${st.purseRemaining},${ptsPerCr},"${topPName}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `falak26_leaderboard_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Leaderboard Header with Controls */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem' }}>
              <Trophy size={22} style={{ color: '#FBBF24' }} />
              <span>TOURNAMENT STANDINGS & SQUADS</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Side-by-side team overview with live Omni Points and player rosters.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* View Mode Toggle: Grid Cards (Side-by-Side) vs Table */}
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2px' }}>
              <button 
                className="btn btn-sm"
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'grid' ? '#38BDF8' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <LayoutGrid size={14} />
                <span>Side-by-Side Grid</span>
              </button>

              <button 
                className="btn btn-sm"
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'table' ? '#38BDF8' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <Table size={14} />
                <span>Table View</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              <select 
                className="select-input" 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
              >
                <option value="points_desc">Sort: Highest Omni Points</option>
                <option value="purse_desc">Sort: Remaining Purse</option>
                <option value="squad_desc">Sort: Squad Size</option>
              </select>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Export CSV">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: SIDE-BY-SIDE CARDS WITH PLAYERS WRITTEN BELOW THEM */}
      {viewMode === 'grid' && (
        <div className="teams-grid-container">
          {teamsWithStats.map((st, idx) => {
            const spentPercent = Math.min(100, (st.purseSpent / (st.initialPurse || 1)) * 100);
            const rankLabel = idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
            const rankColor = idx === 0 ? '#FBBF24' : idx === 1 ? '#94A3B8' : idx === 2 ? '#F97316' : 'var(--text-secondary)';

            return (
              <div 
                key={st.team.id} 
                className="team-desk-card"
                style={{ 
                  borderTop: `4px solid ${st.team.color}`,
                  display: 'flex', 
                  flexDirection: 'column',
                  background: 'var(--bg-card)'
                }}
              >
                {/* Team Card Header */}
                <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span 
                        style={{ 
                          width: 34, 
                          height: 34, 
                          borderRadius: 8, 
                          background: st.team.color, 
                          color: '#000', 
                          fontWeight: 900, 
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {st.team.shortName}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="num-mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: rankColor }}>
                            {rankLabel}
                          </span>
                          <strong 
                            style={{ color: '#FFF', fontSize: '0.95rem', cursor: onSelectTeam ? 'pointer' : 'default' }}
                            onClick={() => onSelectTeam && onSelectTeam(st.team.id)}
                            title="Click to view detailed dossier"
                          >
                            {st.team.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          Budget: ₹{st.initialPurse.toFixed(1)} Cr
                        </div>
                      </div>
                    </div>

                    {/* Total Omni Points Box */}
                    <div style={{ textAlign: 'right', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>TOTAL POINTS</div>
                      <div className="num-mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
                        {st.totalPoints.toFixed(1)}
                      </div>
                    </div>

                  </div>

                  {/* Purse Metrics Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.85rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>REMAINING</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FBBF24' }}>
                        ₹{st.purseRemaining.toFixed(2)} Cr
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>SPENT</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        ₹{st.purseSpent.toFixed(2)} Cr
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>SQUAD</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
                        {st.squadCount} Players
                      </div>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${spentPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #38BDF8)', borderRadius: '9999px' }} />
                  </div>
                </div>

                {/* SQUAD PLAYERS SECTION - WRITTEN BELOW THEM */}
                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                      ACQUIRED PLAYERS ({st.squadCount})
                    </span>
                    {st.squadCount > 0 && onSelectTeam && (
                      <button 
                        onClick={() => onSelectTeam(st.team.id)}
                        style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <span>Full Dossier</span>
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>

                  {st.squadCount === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', margin: 'auto 0' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>0 players acquired</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Awaiting bids from Auction Desk</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {st.squad.map(player => {
                        const roleClass = player.role === 'BATSMAN' ? 'role-bat' :
                                          player.role === 'BOWLER' ? 'role-bowl' :
                                          player.role === 'ALL ROUNDER' ? 'role-ar' : 'role-wk';
                        return (
                          <div 
                            key={player.overallRank}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.65rem',
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              {/* Global Rank Badge: Rank #1, Rank #2, etc. */}
                              <span 
                                className="rank-badge" 
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', flexShrink: 0 }}
                                title="Excel Global Rank"
                              >
                                Rank #{player.overallRank}
                              </span>

                              <div style={{ minWidth: 0 }}>
                                <div 
                                  style={{ 
                                    fontWeight: 700, 
                                    fontSize: '0.875rem', 
                                    color: '#FFF', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    cursor: onFocusPlayer ? 'pointer' : 'default'
                                  }}
                                  onClick={() => onFocusPlayer && onFocusPlayer(player.overallRank)}
                                  title={`Click to focus ${player.name} in Auction Desk`}
                                >
                                  {player.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                                  <span className={`role-badge ${roleClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                    {player.role}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div className="num-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FBBF24' }}>
                                  ₹{player.soldPrice.toFixed(2)} Cr
                                </div>
                                <div className="num-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
                                  {player.points} pts
                                </div>
                              </div>

                              {onUndoSale && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Release #${player.overallRank} ${player.name} from ${st.team.name}?`)) {
                                      onUndoSale(player.overallRank);
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Release player"
                                >
                                  <Trash2 size={13} style={{ color: '#F87171' }} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW (Retained for tabular comparisons & reference) */}
      {viewMode === 'table' && (
        <div className="card">
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>RANK</th>
                  <th>TEAM</th>
                  <th>SQUAD SIZE</th>
                  <th>TOTAL OMNI POINTS</th>
                  <th>INITIAL PURSE</th>
                  <th>PURSE SPENT</th>
                  <th>PURSE REMAINING</th>
                  <th>EFFICIENCY (PTS/CR)</th>
                  <th>TOP MARQUEE PLAYER</th>
                </tr>
              </thead>
              <tbody>
                {teamsWithStats.map((st, idx) => {
                  const topPlayer = st.squad.length > 0 ? [...st.squad].sort((a, b) => b.points - a.points)[0] : null;
                  const ptsPerCr = st.purseSpent > 0 ? (st.totalPoints / st.purseSpent).toFixed(1) : '-';

                  return (
                    <tr key={st.team.id}>
                      <td className="num-mono" style={{ fontWeight: 800, fontSize: '1rem', color: idx === 0 ? '#FBBF24' : idx === 1 ? '#94A3B8' : idx === 2 ? '#F97316' : 'var(--text-tertiary)' }}>
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>

                      <td>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                          onClick={() => onSelectTeam && onSelectTeam(st.team.id)}
                        >
                          <span 
                            style={{ 
                              width: 28, 
                              height: 28, 
                              borderRadius: 6, 
                              background: st.team.color, 
                              color: '#000', 
                              fontWeight: 900, 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {st.team.shortName}
                          </span>
                          <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{st.team.name}</strong>
                        </div>
                      </td>

                      <td className="num-mono" style={{ fontWeight: 600 }}>
                        {st.squadCount} players
                      </td>

                      <td className="num-mono" style={{ fontWeight: 900, fontSize: '1.25rem', color: '#38BDF8' }}>
                        {st.totalPoints.toFixed(1)} pts
                      </td>

                      <td className="num-mono" style={{ color: 'var(--text-secondary)' }}>
                        ₹{st.initialPurse.toFixed(2)} Cr
                      </td>

                      <td className="num-mono" style={{ color: 'var(--text-secondary)' }}>
                        ₹{st.purseSpent.toFixed(2)} Cr
                      </td>

                      <td className="num-mono" style={{ fontWeight: 800, color: '#FBBF24', fontSize: '1.05rem' }}>
                        ₹{st.purseRemaining.toFixed(2)} Cr
                      </td>

                      <td className="num-mono" style={{ color: '#34D399', fontWeight: 600 }}>
                        {ptsPerCr}
                      </td>

                      <td>
                        {topPlayer ? (
                          <div style={{ fontSize: '0.85rem' }}>
                            <span className="num-mono" style={{ color: '#FBBF24', fontWeight: 700 }}>#{topPlayer.overallRank}</span>{' '}
                            <strong style={{ color: '#FFF' }}>{topPlayer.name}</strong>{' '}
                            <span style={{ color: '#38BDF8' }}>({topPlayer.points}p)</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
