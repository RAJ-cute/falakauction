import React, { useState, useRef, useEffect } from 'react';
import { Gavel, Search, CheckCircle2, RotateCcw } from 'lucide-react';

export default function Header({ 
  players, 
  onSelectPlayer, 
  sales, 
  unsold, 
  onResetAuction,
  activeTab,
  setActiveTab,
  teamsCount,
  compareCount
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingPlayers = query.trim() ? players.filter(p => {
    const q = query.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) ||
           `#${p.overallRank}` === q ||
           String(p.overallRank) === q ||
           String(p.slideNo) === q;
  }).slice(0, 8) : [];

  const handleSelect = (rank) => {
    onSelectPlayer(rank);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <header className="top-header">
      {/* Left: Branding */}
      <div className="brand-section">
        <div className="brand-icon-wrap">
          <Gavel size={20} />
        </div>
        <div className="brand-text">
          <h1>FALAK '26 AUCTION</h1>
          <p>Live Bidding & Omni Points System</p>
        </div>
      </div>

      {/* Center: Prominent Global Player Search for Live Bidding */}
      <div className="header-search-wrap" ref={searchRef}>
        <div className="header-search-input-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search any player to bid (e.g. Kohli, Bumrah, #1, Slide 18)..." 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            className="header-search-input"
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {isOpen && matchingPlayers.length > 0 && (
          <div className="header-search-dropdown">
            {matchingPlayers.map(p => {
              const sale = sales[p.overallRank];
              const isUnsold = unsold.includes(p.overallRank);
              return (
                <div 
                  key={p.overallRank}
                  className="search-dropdown-item"
                  onClick={() => handleSelect(p.overallRank)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="rank-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                      #{p.overallRank}
                    </span>
                    <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>({p.role} • Slide #{p.slideNo})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="num-mono" style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem' }}>
                      {p.points} pts
                    </span>
                    <span className="num-mono" style={{ color: '#FBBF24', fontSize: '0.8rem' }}>
                      ₹{p.basePrice.toFixed(2)} Cr
                    </span>
                    {sale ? (
                      <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: '#FDA4AF', fontSize: '0.7rem' }}>
                        Sold
                      </span>
                    ) : isUnsold ? (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', fontSize: '0.7rem' }}>
                        Unsold
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', fontSize: '0.7rem' }}>
                        Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Auto-Save Status & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
          <CheckCircle2 size={15} />
          <span>Auto-Saved</span>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={onResetAuction}
          title="Reset auction data"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}
