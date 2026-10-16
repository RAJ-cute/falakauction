import React, { useState, useRef, useEffect } from 'react';
import { Search, Scale, X, Zap, Plus, Trophy, Check, ArrowRight } from 'lucide-react';

export default function PlayerComparison({ players, comparisonRanks, setComparisonRanks, onFocusPlayerInDesk }) {
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // If comparison is empty, default to Rank 1 (Kohli) and Rank 2 (Narine) so it's NEVER blank!
  useEffect(() => {
    if (comparisonRanks.length === 0) {
      setComparisonRanks([1, 2]);
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const comparedPlayers = comparisonRanks.map(rank => players.find(p => p.overallRank === rank)).filter(Boolean);

  const handleAddPlayer = (rank) => {
    if (!comparisonRanks.includes(rank)) {
      if (comparisonRanks.length >= 4) {
        setComparisonRanks([...comparisonRanks.slice(1), rank]);
      } else {
        setComparisonRanks([...comparisonRanks, rank]);
      }
    }
    setSearchInput('');
    setIsOpen(false);
  };

  const handleRemove = (rank) => {
    if (comparisonRanks.length <= 1) {
      alert('Keep at least 1 player to compare, or pick another player.');
      return;
    }
    setComparisonRanks(comparisonRanks.filter(r => r !== rank));
  };

  const matchingPlayers = searchInput.trim() ? players.filter(p => 
    p.name.toLowerCase().includes(searchInput.toLowerCase().trim()) ||
    `#${p.overallRank}` === searchInput.trim()
  ).slice(0, 8) : [];

  // Best metrics calculation for clean green highlighting
  const maxPoints = Math.max(...comparedPlayers.map(p => p.points || 0));
  const maxRuns = Math.max(...comparedPlayers.map(p => p.runs || 0));
  const maxSR = Math.max(...comparedPlayers.map(p => p.batSR || 0));
  const maxWkts = Math.max(...comparedPlayers.map(p => p.wickets || 0));
  const minEcon = Math.min(...comparedPlayers.map(p => p.economy > 0 ? p.economy : 999));
  const maxFantasy = Math.max(...comparedPlayers.map(p => p.fantasyScore || 0));
  const maxVol = Math.max(...comparedPlayers.map(p => p.volScore || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Controls Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'rgba(15, 23, 42, 0.9)', overflow: 'visible', zIndex: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Scale size={20} style={{ color: '#38BDF8' }} />
              <span>Head-to-Head Player Comparison</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Side-by-side breakdown of career stats, Omni Points, and scouting valuations from Master Excel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setComparisonRanks([1, 2, 3, 4])}
              title="Compare top 4 marquee players"
            >
              <Trophy size={14} style={{ color: '#FBBF24' }} />
              <span>Top 4 Marquee</span>
            </button>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ color: '#F87171' }}
              onClick={() => setComparisonRanks([1])}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Add Pills */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search Box with High z-index Popover */}
          <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                className="input-text" 
                placeholder="Search any player to add (e.g. Kohli, Bumrah, Narine)..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => {
                  if (searchInput.trim()) setIsOpen(true);
                }}
                style={{ paddingLeft: '2.3rem' }}
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown - Guaranteed fully visible! */}
            {isOpen && matchingPlayers.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: '#0B1120',
                border: '1px solid var(--border-focus)',
                borderRadius: '10px',
                zIndex: 9999,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                maxHeight: '280px',
                overflowY: 'auto',
                padding: '0.4rem'
              }}>
                {matchingPlayers.map(p => (
                  <div 
                    key={p.overallRank}
                    onClick={() => handleAddPlayer(p.overallRank)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="rank-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                        #{p.overallRank}
                      </span>
                      <div>
                        <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{p.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '0.4rem' }}>
                          ({p.role} • Slide #{p.slideNo})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="num-mono" style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem' }}>
                        {p.points} pts
                      </span>
                      <span className="num-mono" style={{ color: '#FBBF24', fontSize: '0.8rem' }}>
                        ₹{p.basePrice.toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>Quick Add:</span>
            {[
              { rank: 1, name: 'Kohli' },
              { rank: 2, name: 'Narine' },
              { rank: 3, name: 'Bhuvneshwar' },
              { rank: 4, name: 'KL Rahul' },
              { rank: 5, name: 'AB de Villiers' },
              { rank: 8, name: 'Russell' }
            ].map(item => (
              <button 
                key={item.rank}
                onClick={() => handleAddPlayer(item.rank)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
              >
                <Plus size={12} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Unified Side-by-Side Comparison Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="pro-table" style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse' }}>
          
          {/* Table Header: Player Identity Cards */}
          <thead>
            <tr>
              <th style={{ width: '220px', background: 'rgba(11,17,32,0.95)', padding: '1.25rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                  COMPARED PLAYERS ({comparedPlayers.length})
                </span>
              </th>

              {comparedPlayers.map(p => {
                const roleClass = p.role === 'BATSMAN' ? 'role-bat' :
                                  p.role === 'BOWLER' ? 'role-bowl' :
                                  p.role === 'ALL ROUNDER' ? 'role-ar' : 'role-wk';
                return (
                  <th key={p.overallRank} style={{ padding: '1.25rem 1.5rem', background: 'rgba(15,23,42,0.9)', borderRight: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                      
                      {/* Remove Button */}
                      {comparedPlayers.length > 1 && (
                        <button 
                          onClick={() => handleRemove(p.overallRank)}
                          style={{ position: 'absolute', top: -4, right: -4, background: 'rgba(244,63,94,0.15)', border: 'none', color: '#FDA4AF', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove player"
                        >
                          <X size={13} />
                        </button>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div className="rank-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                          👑 Rank #{p.overallRank}
                        </div>
                        <span className={`role-badge ${roleClass}`} style={{ fontSize: '0.7rem' }}>
                          {p.role}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFF', lineHeight: 1.15, textTransform: 'uppercase' }}>
                        {p.name}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Slide #{p.slideNo} • {p.tier}
                      </div>

                      {/* Top Omni Score Box */}
                      <div style={{ marginTop: '0.4rem', background: p.points === maxPoints ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)', border: p.points === maxPoints ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: p.points === maxPoints ? '#38BDF8' : 'var(--text-secondary)' }}>
                          OMNI POINTS
                        </span>
                        <span className="num-mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: p.points === maxPoints ? '#38BDF8' : '#FFF' }}>
                          {p.points} {p.points === maxPoints ? '👑' : ''}
                        </span>
                      </div>

                      {/* Bid in Auction Button */}
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.5rem', width: '100%', padding: '0.45rem' }}
                        onClick={() => onFocusPlayerInDesk(p.overallRank)}
                      >
                        <Zap size={14} />
                        <span>Bid in Auction Desk</span>
                      </button>

                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Side-by-Side Metric Rows */}
          <tbody>
            
            {/* --- SECTION 1: VALUATION --- */}
            <tr>
              <td colSpan={comparedPlayers.length + 1} style={{ background: 'rgba(11,17,32,0.95)', padding: '0.5rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                1. VALUATION & FANTASY RATINGS
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Base Price (₹ Cr)
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, color: '#FBBF24', fontSize: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
                  ₹{p.basePrice.toFixed(2)} Cr
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Points / Base Crore
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.pointsPerBaseCr.toFixed(1)}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Fantasy Score
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, color: p.fantasyScore === maxFantasy ? '#A855F7' : 'inherit', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.fantasyScore} {p.fantasyScore === maxFantasy && maxFantasy > 0 ? '✓' : ''}
                </td>
              ))}
            </tr>

            {/* --- SECTION 2: BATTING STATS --- */}
            <tr>
              <td colSpan={comparedPlayers.length + 1} style={{ background: 'rgba(11,17,32,0.95)', padding: '0.5rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                2. BATTING PERFORMANCE
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Matches
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.matches}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Career Runs
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: p.runs === maxRuns && maxRuns > 0 ? '#34D399' : '#FFF', background: p.runs === maxRuns && maxRuns > 0 ? 'rgba(16,185,129,0.1)' : 'transparent', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.runs} {p.runs === maxRuns && maxRuns > 0 ? '✓' : ''}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Batting Strike Rate
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, color: p.batSR === maxSR && maxSR > 0 ? '#34D399' : '#FFF', background: p.batSR === maxSR && maxSR > 0 ? 'rgba(16,185,129,0.1)' : 'transparent', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.batSR} {p.batSR === maxSR && maxSR > 0 ? '✓' : ''}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Centuries / Fifties (100s / 50s)
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.hundreds} / {p.fifties}
                </td>
              ))}
            </tr>

            {/* --- SECTION 3: BOWLING & FIELDING --- */}
            <tr>
              <td colSpan={comparedPlayers.length + 1} style={{ background: 'rgba(11,17,32,0.95)', padding: '0.5rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                3. BOWLING & FIELDING
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Career Wickets
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: p.wickets === maxWkts && maxWkts > 0 ? '#34D399' : '#FFF', background: p.wickets === maxWkts && maxWkts > 0 ? 'rgba(16,185,129,0.1)' : 'transparent', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.wickets} {p.wickets === maxWkts && maxWkts > 0 ? '✓' : ''}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Economy Rate
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, color: p.economy > 0 && p.economy === minEcon ? '#34D399' : 'inherit', background: p.economy > 0 && p.economy === minEcon ? 'rgba(16,185,129,0.1)' : 'transparent', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.economy > 0 ? p.economy : '-'} {p.economy > 0 && p.economy === minEcon ? '✓' : ''}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                4W / 5W Hauls
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.fourWHauls} / {p.fiveWHauls}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Catches / Dismissals
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.catchesDismissals}
                </td>
              ))}
            </tr>

            {/* --- SECTION 4: ADVANCED SCOUTING --- */}
            <tr>
              <td colSpan={comparedPlayers.length + 1} style={{ background: 'rgba(11,17,32,0.95)', padding: '0.5rem 1.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#A855F7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                4. ADVANCED SCOUTING SCORES
              </td>
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Volume Score (Vol_Score)
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 800, color: p.volScore === maxVol && maxVol > 0 ? '#38BDF8' : 'inherit', borderRight: '1px solid var(--border-subtle)' }}>
                  {p.volScore}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Rate Score (Rate_Score)
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.rateScore}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Card Equal Score
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.cardEqualScore}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-secondary)', padding: '0.75rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
                Floor (P10) / Ceiling (P90)
              </td>
              {comparedPlayers.map(p => (
                <td key={p.overallRank} className="num-mono" style={{ fontWeight: 700, borderRight: '1px solid var(--border-subtle)' }}>
                  {p.floorP10} / {p.ceilingP90}
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>

    </div>
  );
}
