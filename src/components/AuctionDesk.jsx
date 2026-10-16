import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Gavel, Ban, RotateCcw, Scale, Check, AlertTriangle, Users } from 'lucide-react';

export default function AuctionDesk({
  players,
  currentRank,
  setCurrentRank,
  teams,
  sales,
  unsold,
  onSellPlayer,
  onMarkUnsold,
  onUndoSale,
  onAddToCompare,
  activityLog,
  getTeamStats
}) {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jumpSlide, setJumpSlide] = useState('');
  
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [bidPrice, setBidPrice] = useState('2.00');

  const player = players.find(p => p.overallRank === currentRank) || players[0];
  const sale = sales[player.overallRank];
  const isSold = !!sale;
  const isUnsold = unsold.includes(player.overallRank);

  // Sync bid price and selected team when player changes
  useEffect(() => {
    if (isSold) {
      setBidPrice(sale.soldPrice.toFixed(2));
      setSelectedTeamId(sale.teamId);
    } else {
      setBidPrice(player.basePrice.toFixed(2));
      if (!selectedTeamId && teams.length > 0) {
        setSelectedTeamId(teams[0].id);
      }
    }
  }, [player.overallRank, isSold]);

  // Navigate to previous player
  const handlePrev = () => {
    const idx = players.findIndex(p => p.overallRank === player.overallRank);
    if (idx > 0) setCurrentRank(players[idx - 1].overallRank);
  };

  // Navigate to next player
  const handleNext = () => {
    const idx = players.findIndex(p => p.overallRank === player.overallRank);
    if (idx < players.length - 1) setCurrentRank(players[idx + 1].overallRank);
  };

  const handleJumpSlide = (e) => {
    e.preventDefault();
    const slideNum = parseInt(jumpSlide, 10);
    const target = players.find(p => p.slideNo === slideNum);
    if (target) {
      setCurrentRank(target.overallRank);
      setJumpSlide('');
    } else {
      alert('Slide number must be between 1 and 310');
    }
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert('Please select a team!');
      return;
    }
    const priceNum = parseFloat(bidPrice);
    if (!priceNum || priceNum <= 0) {
      alert('Please enter a valid price in Crores');
      return;
    }

    const teamStats = getTeamStats(selectedTeamId);
    if (priceNum > teamStats.purseRemaining) {
      alert(`Cannot sell! ${teamStats.team.name} only has ₹${teamStats.purseRemaining.toFixed(2)} Cr remaining.`);
      return;
    }

    onSellPlayer(player.overallRank, selectedTeamId, priceNum);
  };

  const handlePriceInc = (increment) => {
    const current = parseFloat(bidPrice) || 0;
    setBidPrice((current + increment).toFixed(2));
  };

  const selectedTeamStats = selectedTeamId ? getTeamStats(selectedTeamId) : null;
  const currentBidNum = parseFloat(bidPrice) || 0;
  const canAfford = selectedTeamStats ? selectedTeamStats.purseRemaining >= currentBidNum : false;

  const roleClass = player.role === 'BATSMAN' ? 'role-bat' :
                    player.role === 'BOWLER' ? 'role-bowl' :
                    player.role === 'ALL ROUNDER' ? 'role-ar' : 'role-wk';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* Top Slide & Filter Bar - Ultra Compact */}
      <div className="card" style={{ padding: '0.5rem 1rem', background: 'rgba(15, 23, 42, 0.75)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Slide Navigator Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrev} title="Previous player" style={{ padding: '0.25rem 0.6rem' }}>
              <ChevronLeft size={15} />
              <span>Prev</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.65rem', borderRadius: 6 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>SLIDE</span>
              <span className="num-mono" style={{ fontSize: '0.875rem', fontWeight: 800, color: '#38BDF8' }}>
                #{player.slideNo}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>/ 310</span>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleNext} title="Next player" style={{ padding: '0.25rem 0.6rem' }}>
              <span>Next</span>
              <ChevronRight size={15} />
            </button>

            {/* Jump to Slide Form */}
            <form onSubmit={handleJumpSlide} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.4rem' }}>
              <input 
                type="number" 
                min="1" 
                max="310" 
                placeholder="Slide #" 
                className="input-text num-mono"
                value={jumpSlide}
                onChange={(e) => setJumpSlide(e.target.value)}
                style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Go</button>
            </form>
          </div>

          {/* Quick Role & Status Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(11, 17, 32, 0.6)', padding: '0.2rem', borderRadius: '6px' }}>
              {['ALL', 'BATSMAN', 'BOWLER', 'ALL ROUNDER', 'WICKET KEEPER'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: roleFilter === r ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: roleFilter === r ? '#38BDF8' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {r === 'ALL' ? 'All Roles' : r === 'BATSMAN' ? 'Batsmen' : r === 'BOWLER' ? 'Bowlers' : r === 'ALL ROUNDER' ? 'All-Rounders' : 'WKs'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(11, 17, 32, 0.6)', padding: '0.2rem', borderRadius: '6px' }}>
              {['ALL', 'AVAILABLE', 'SOLD', 'UNSOLD'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: statusFilter === st ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: statusFilter === st ? '#FFF' : 'var(--text-tertiary)',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SIDE-BY-SIDE MAIN BIDDING ARENA: NO SCROLLING REQUIRED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: SPOTLIGHT PLAYER HERO CARD */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0D1424, #111A2E)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            {/* Top Rank Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div className="rank-badge" style={{ fontSize: '0.85rem', padding: '0.2rem 0.65rem' }}>
                  👑 GLOBAL RANK #{player.overallRank}
                </div>
                <span className={`role-badge ${roleClass}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                  {player.role} (#{player.roleRank})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.55rem', borderRadius: 4 }}>
                  {player.tier}
                </span>
              </div>

              <div className="num-mono" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Slide #{player.slideNo} / 310
              </div>
            </div>

            {/* Player Name & Big Omni Points */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1 }}>
                  {player.name}
                </h2>
                <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Base Price: <strong className="num-mono" style={{ color: '#FBBF24' }}>₹{player.basePrice.toFixed(2)} Cr</strong></span>
                  <span>•</span>
                  <span>Pts / Base Cr: <strong className="num-mono" style={{ color: '#38BDF8' }}>{player.pointsPerBaseCr.toFixed(1)}</strong></span>
                </div>
              </div>

              {/* Omni Points Display */}
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.25))', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.55rem 1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: '#38BDF8' }}>OMNI POINTS</div>
                  <div className="num-mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{player.points}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', padding: '0.55rem 0.85rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>FANTASY</div>
                  <div className="num-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A855F7', lineHeight: 1 }}>{player.fantasyScore}</div>
                </div>
              </div>
            </div>

            {/* Compact Career Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', background: 'rgba(11,17,32,0.6)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>MATCHES</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.matches}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>RUNS</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FBBF24' }}>{player.runs}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>BAT SR</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.batSR}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>100s / 50s</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.hundreds}/{player.fifties}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>WICKETS</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>{player.wickets}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>ECONOMY</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.economy > 0 ? player.economy : '-'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>CATCHES</div>
                <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.catchesDismissals}</div>
              </div>
            </div>
          </div>

          {/* Scouting Metrics Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.75rem', borderRadius: 6 }}>
            <span>Vol Score: <strong className="num-mono" style={{ color: '#FFF' }}>{player.volScore}</strong></span>
            <span>Rate: <strong className="num-mono" style={{ color: '#FFF' }}>{player.rateScore}</strong></span>
            <span>Card Eq: <strong className="num-mono" style={{ color: '#FFF' }}>{player.cardEqualScore}</strong></span>
            <span>Floor (P10): <strong className="num-mono" style={{ color: '#FFF' }}>{player.floorP10}</strong></span>
            <span>Ceil (P90): <strong className="num-mono" style={{ color: '#FFF' }}>{player.ceilingP90}</strong></span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUCTION SALE ACTION (BIDDING COCKPIT) */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            {/* Header with Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gavel size={18} style={{ color: '#38BDF8' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>
                  AUCTION SALE ACTION
                </h3>
              </div>

              {/* Status Badge */}
              {isSold ? (
                <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#FDA4AF', border: '1px solid rgba(244,63,94,0.3)' }}>
                  SOLD to {teams.find(t => t.id === sale.teamId)?.shortName || 'Team'}
                </span>
              ) : isUnsold ? (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>
                  UNSOLD
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' }}>
                  AVAILABLE
                </span>
              )}
            </div>

            <form onSubmit={handleSellSubmit}>
              {/* Winning Team Select */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  SELECT WINNING TEAM
                </label>
                <select 
                  className="select-input" 
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={isSold}
                  required
                  style={{ fontSize: '0.9rem', padding: '0.6rem 0.85rem' }}
                >
                  <option value="">-- Select Team --</option>
                  {teams.map(t => {
                    const st = getTeamStats(t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName}) - Purse: ₹{st.purseRemaining.toFixed(2)} Cr
                      </option>
                    );
                  })}
                </select>

                {selectedTeamStats && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                    {canAfford ? (
                      <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <Check size={14} /> Available: ₹{selectedTeamStats.purseRemaining.toFixed(2)} Cr (Leaves: ₹{(selectedTeamStats.purseRemaining - currentBidNum).toFixed(2)} Cr)
                      </span>
                    ) : (
                      <span style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> INSUFFICIENT PURSE! Only has ₹{selectedTeamStats.purseRemaining.toFixed(2)} Cr
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Sold Price Input & Quick Increment Pills */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  SOLD PRICE (₹ CRORES)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#FBBF24', fontWeight: 800, fontSize: '1.15rem' }}>
                    ₹
                  </span>
                  <input 
                    type="number"
                    step="0.05"
                    min="0.05"
                    className="input-text num-mono"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    disabled={isSold}
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24', height: '44px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    Cr
                  </span>
                </div>

                {!isSold && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {[0.25, 0.50, 1.0, 2.0, 5.0].map(inc => (
                      <button 
                        key={inc}
                        type="button"
                        onClick={() => handlePriceInc(inc)}
                        className="btn btn-secondary btn-sm num-mono"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        +{inc}
                      </button>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setBidPrice(player.basePrice.toFixed(2))}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', color: '#FBBF24', padding: '0.2rem 0.5rem' }}
                    >
                      Base
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!isSold ? (
                  <>
                    <button 
                      type="submit" 
                      className="btn btn-success btn-lg"
                      disabled={!selectedTeamId || !canAfford}
                      style={{ flex: 1.5, padding: '0.75rem' }}
                    >
                      <Gavel size={18} />
                      <span>SOLD TO TEAM</span>
                    </button>

                    <button 
                      type="button" 
                      className="btn btn-secondary btn-lg"
                      onClick={() => onMarkUnsold(player.overallRank)}
                      style={{ color: '#FBBF24', padding: '0.75rem 1rem' }}
                    >
                      <Ban size={16} />
                      <span>MARK UNSOLD</span>
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-lg"
                    onClick={() => onUndoSale(player.overallRank)}
                    style={{ flex: 1.5, padding: '0.75rem' }}
                  >
                    <RotateCcw size={18} />
                    <span>RELEASE / UNDO SALE</span>
                  </button>
                )}

                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg"
                  onClick={() => onAddToCompare(player.overallRank)}
                  title="Add to player comparison arena"
                  style={{ padding: '0.75rem 1rem' }}
                >
                  <Scale size={16} />
                  <span>Compare</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mini Team Purse Indicator at the bottom of Right Card */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Participating Teams:</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {teams.slice(0, 8).map(t => {
                const st = getTeamStats(t.id);
                return (
                  <span 
                    key={t.id}
                    title={`${t.name}: ₹${st.purseRemaining.toFixed(1)} Cr remaining`}
                    style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '0.15rem 0.35rem', 
                      borderRadius: 4, 
                      background: t.color, 
                      color: '#000',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedTeamId(t.id)}
                  >
                    {t.shortName}
                  </span>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Compact Strip: Recent Transactions Log */}
      {activityLog.length > 0 && (
        <div className="card" style={{ padding: '0.75rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
              RECENT SALES ACTIVITY
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {activityLog.slice(-5).reverse().map(act => {
              const p = players.find(x => x.overallRank === act.playerRank);
              const t = teams.find(x => x.id === act.teamId);
              return (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.65rem', background: 'rgba(11,17,32,0.5)', borderRadius: '6px', fontSize: '0.8rem', whiteSpace: 'nowrap', border: '1px solid var(--border-subtle)' }}>
                  <span className="badge" style={{ background: act.type === 'SOLD' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: act.type === 'SOLD' ? '#34D399' : '#FBBF24', fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                    {act.type}
                  </span>
                  <strong>#{p ? p.overallRank : act.playerRank} {p?.name.split(' ')[0]}</strong>
                  {t && <span>→ <span style={{ color: t.color, fontWeight: 700 }}>{t.shortName}</span> (₹{act.price} Cr)</span>}
                  {act.type === 'SOLD' && (
                    <button 
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#F87171', padding: '0 0.2rem', fontSize: '0.7rem' }}
                      onClick={() => onUndoSale(act.playerRank)}
                    >
                      Undo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
