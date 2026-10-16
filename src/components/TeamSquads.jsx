import React, { useState } from 'react';
import { Shield, Trophy, DollarSign, Users, Trash2, ArrowUpDown, LayoutGrid, User, ExternalLink } from 'lucide-react';

export default function TeamSquads({ teams, selectedTeamId, setSelectedTeamId, getTeamStats, onUndoSale, onNavigateToDesk, onFocusPlayer }) {
  const [viewMode, setViewMode] = useState('all'); // Default to 'all' side-by-side as requested!
  const [sortBy, setSortBy] = useState('rank_asc');

  if (teams.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <h3>No teams configured</h3>
        <p style={{ marginTop: '0.5rem' }}>Please set up your teams in the Team Setup tab first.</p>
      </div>
    );
  }

  const activeTeamId = selectedTeamId || teams[0].id;
  const stats = getTeamStats(activeTeamId);
  const team = stats.team;

  // Role distribution
  const batCount = stats.squad.filter(p => p.role === 'BATSMAN').length;
  const bowlCount = stats.squad.filter(p => p.role === 'BOWLER').length;
  const arCount = stats.squad.filter(p => p.role === 'ALL ROUNDER').length;
  const wkCount = stats.squad.filter(p => p.role === 'WICKET KEEPER').length;

  const spentPercent = Math.min(100, (stats.purseSpent / (stats.initialPurse || 1)) * 100);

  // Sorted Squad for single view
  const sortedSquad = [...stats.squad].sort((a, b) => {
    if (sortBy === 'rank_asc') return a.overallRank - b.overallRank;
    if (sortBy === 'points_desc') return b.points - a.points;
    if (sortBy === 'price_desc') return b.soldPrice - a.soldPrice;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* View Mode & Team Navigation Top Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: '#38BDF8' }} />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>
                TEAM SQUADS & PURSES
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {viewMode === 'all' 
                  ? 'Viewing all team squads side-by-side with player rosters' 
                  : `Focusing on ${team.name} detailed squad dossier`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* View Switcher: All Side-by-Side vs Single Team Focus */}
            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2px' }}>
              <button 
                className="btn btn-sm"
                onClick={() => setViewMode('all')}
                style={{
                  background: viewMode === 'all' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'all' ? '#38BDF8' : 'var(--text-secondary)',
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
                <span>All Teams Side-by-Side</span>
              </button>

              <button 
                className="btn btn-sm"
                onClick={() => setViewMode('single')}
                style={{
                  background: viewMode === 'single' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewMode === 'single' ? '#38BDF8' : 'var(--text-secondary)',
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
                <User size={14} />
                <span>Single Team Focus</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* VIEW MODE 1: ALL SQUADS SIDE-BY-SIDE IN GRID */}
      {viewMode === 'all' && (
        <div className="teams-grid-container">
          {teams.map(t => {
            const tStats = getTeamStats(t.id);
            const tSpentPercent = Math.min(100, (tStats.purseSpent / (tStats.initialPurse || 1)) * 100);

            return (
              <div 
                key={t.id} 
                className="team-desk-card"
                style={{ 
                  borderTop: `4px solid ${t.color}`,
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
                          background: t.color, 
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
                        {t.shortName}
                      </span>
                      <div>
                        <strong 
                          style={{ color: '#FFF', fontSize: '0.95rem', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedTeamId(t.id);
                            setViewMode('single');
                          }}
                          title="Click to view detailed dossier"
                        >
                          {t.name}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          Budget: ₹{tStats.initialPurse.toFixed(1)} Cr
                        </div>
                      </div>
                    </div>

                    {/* Total Omni Points Box */}
                    <div style={{ textAlign: 'right', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.65rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>OMNI POINTS</div>
                      <div className="num-mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
                        {tStats.totalPoints.toFixed(1)}
                      </div>
                    </div>

                  </div>

                  {/* Purse Metrics Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.85rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>REMAINING</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FBBF24' }}>
                        ₹{tStats.purseRemaining.toFixed(2)} Cr
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>SPENT</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        ₹{tStats.purseSpent.toFixed(2)} Cr
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>SQUAD</div>
                      <div className="num-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
                        {tStats.squadCount} Players
                      </div>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${tSpentPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #38BDF8)', borderRadius: '9999px' }} />
                  </div>
                </div>

                {/* SQUAD PLAYERS SECTION - WRITTEN BELOW THEM */}
                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                      ACQUIRED PLAYERS ({tStats.squadCount})
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setViewMode('single');
                      }}
                      style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <span>Focus Team</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>

                  {tStats.squadCount === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', margin: 'auto 0' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>0 players acquired</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Awaiting bids from Auction Desk</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {tStats.squad.map(player => {
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
                                  title={`Focus ${player.name} in Auction Desk`}
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
                                    if (confirm(`Release #${player.overallRank} ${player.name} from ${t.name}?`)) {
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

      {/* VIEW MODE 2: SINGLE TEAM FOCUS DOSSIER */}
      {viewMode === 'single' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Team Selector Navigation Strip */}
          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
            {teams.map(t => {
              const tStats = getTeamStats(t.id);
              const isActive = t.id === activeTeamId;
              return (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${t.color}`,
                    color: '#FFF',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.shortName}</span>
                  <span className="num-mono" style={{ fontSize: '0.75rem', color: '#FBBF24' }}>
                    ₹{tStats.purseRemaining.toFixed(1)} Cr
                  </span>
                  <span className="num-mono" style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                    {tStats.totalPoints.toFixed(0)}p
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Team Executive Header Dossier */}
          <div className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(20,28,48,0.95))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: '12px', 
                    background: team.color, 
                    color: '#000', 
                    fontWeight: 900, 
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                  }}
                >
                  {team.shortName}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    {team.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    <span>Total Budget: <strong className="num-mono" style={{ color: '#FFF' }}>₹{stats.initialPurse.toFixed(2)} Cr</strong></span>
                    <span>•</span>
                    <span>Squad Strength: <strong className="num-mono" style={{ color: '#FFF' }}>{stats.squadCount} Players</strong></span>
                  </div>
                </div>
              </div>

              {/* Metric Highlights */}
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.65rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em' }}>TOTAL OMNI POINTS</div>
                  <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1.1 }}>
                    {stats.totalPoints.toFixed(1)}
                  </div>
                </div>

                <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '0.65rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.05em' }}>REMAINING PURSE</div>
                  <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1.1 }}>
                    ₹{stats.purseRemaining.toFixed(2)} Cr
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', padding: '0.65rem 1.1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>PURSE SPENT</div>
                  <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFF', lineHeight: 1.1 }}>
                    ₹{stats.purseSpent.toFixed(2)} Cr
                  </div>
                </div>
              </div>

            </div>

            {/* Purse Progress Bar */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Spent: ₹{stats.purseSpent.toFixed(2)} Cr ({spentPercent.toFixed(1)}%)
                </span>
                <span style={{ color: '#FBBF24' }}>
                  Available: ₹{stats.purseRemaining.toFixed(2)} Cr
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${spentPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #38BDF8)', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>

          {/* Squad Composition Chips & Sort Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="role-badge role-bat">🏏 Batsmen: {batCount}</span>
              <span className="role-badge role-bowl">⚡ Bowlers: {bowlCount}</span>
              <span className="role-badge role-ar">🔄 All-Rounders: {arCount}</span>
              <span className="role-badge role-wk">🧤 WKs: {wkCount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={15} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort Squad:</span>
              <select 
                className="select-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <option value="rank_asc">Global Rank (1 to 310)</option>
                <option value="points_desc">Omni Points (High to Low)</option>
                <option value="price_desc">Sold Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Squad Players Table / Roster */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1rem' }}>
                Full Squad Roster ({stats.squadCount} Players)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Showing Global Excel Rank before each player's name
              </span>
            </div>

            {stats.squadCount === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>No players acquired yet by {team.name}.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Go to the Auction Desk to start bidding on players.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={onNavigateToDesk}>
                  Go to Auction Desk
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>GLOBAL RANK</th>
                      <th>PLAYER NAME</th>
                      <th>ROLE</th>
                      <th>BASE PRICE</th>
                      <th>SOLD PRICE</th>
                      <th>OMNI POINTS</th>
                      <th>KEY STATS</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSquad.map(player => {
                      const roleClass = player.role === 'BATSMAN' ? 'role-bat' :
                                        player.role === 'BOWLER' ? 'role-bowl' :
                                        player.role === 'ALL ROUNDER' ? 'role-ar' : 'role-wk';
                      return (
                        <tr key={player.overallRank}>
                          <td style={{ width: '130px' }}>
                            <div className="rank-badge" title="Global Rank in FALAK Excel">
                              Rank #{player.overallRank}
                            </div>
                          </td>

                          <td>
                            <strong style={{ fontSize: '1.05rem', color: '#FFF' }}>
                              {player.name}
                            </strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              Slide #{player.slideNo} • {player.tier}
                            </div>
                          </td>

                          <td>
                            <span className={`role-badge ${roleClass}`}>
                              {player.role} (#{player.roleRank})
                            </span>
                          </td>

                          <td className="num-mono" style={{ color: 'var(--text-secondary)' }}>
                            ₹{player.basePrice.toFixed(2)} Cr
                          </td>

                          <td className="num-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FBBF24' }}>
                            ₹{player.soldPrice.toFixed(2)} Cr
                          </td>

                          <td className="num-mono" style={{ fontWeight: 900, fontSize: '1.15rem', color: '#38BDF8' }}>
                            {player.points} pts
                          </td>

                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {player.runs > 0 && <span>Runs: <strong className="num-mono" style={{ color: '#FFF' }}>{player.runs}</strong> (SR: {player.batSR}) </span>}
                            {player.wickets > 0 && <span>Wkts: <strong className="num-mono" style={{ color: '#FFF' }}>{player.wickets}</strong> (Econ: {player.economy})</span>}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#F87171' }}
                              onClick={() => {
                                if (confirm(`Release #${player.overallRank} ${player.name} back to available pool?`)) {
                                  onUndoSale(player.overallRank);
                                }
                              }}
                              title="Release player from squad"
                            >
                              <Trash2 size={15} />
                              <span>Release</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
