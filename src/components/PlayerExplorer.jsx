import React, { useState } from 'react';
import { Search, ListFilter, Zap, Scale } from 'lucide-react';

export default function PlayerExplorer({ players, sales, unsold, teams, onFocusPlayer, onAddToCompare }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('rank_asc');

  const filtered = players.filter(p => {
    if (role !== 'ALL' && p.role !== role) return false;
    if (tier !== 'ALL' && !p.tier.startsWith(tier)) return false;

    const pStatus = sales[p.overallRank] ? 'SOLD' : unsold.includes(p.overallRank) ? 'UNSOLD' : 'AVAILABLE';
    if (status !== 'ALL' && pStatus !== status) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) ||
             `#${p.overallRank}` === q ||
             String(p.overallRank) === q ||
             String(p.slideNo) === q;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === 'rank_asc') return a.overallRank - b.overallRank;
    if (sort === 'points_desc') return b.points - a.points;
    if (sort === 'price_desc') return b.basePrice - a.basePrice;
    if (sort === 'slide_asc') return a.slideNo - b.slideNo;
    if (sort === 'name_asc') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">All 310 Players Master Database</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Extracted from FALAK '26 Master Excel with verified Omni Points and Global Rankings.
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}>
          Showing {filtered.length} of 310
        </span>
      </div>

      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            className="input-text" 
            placeholder="Search by name, #rank, or slide..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <select className="select-input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="BATSMAN">Batsmen</option>
          <option value="BOWLER">Bowlers</option>
          <option value="ALL ROUNDER">All Rounders</option>
          <option value="WICKET KEEPER">Wicket Keepers</option>
        </select>

        <select className="select-input" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="ALL">All Tiers</option>
          <option value="S-Tier">S-Tier (Marquee)</option>
          <option value="A-Tier">A-Tier (Core Starter)</option>
          <option value="B-Tier">B-Tier (Solid Value)</option>
          <option value="C-Tier">C-Tier (Budget)</option>
          <option value="D-Tier">D-Tier (Avoid/Filler)</option>
        </select>

        <select className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="SOLD">Sold</option>
          <option value="UNSOLD">Unsold</option>
        </select>

        <select className="select-input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rank_asc">Sort: Global Rank (1 to 310)</option>
          <option value="points_desc">Sort: Omni Points (High to Low)</option>
          <option value="price_desc">Sort: Base Price (High to Low)</option>
          <option value="slide_asc">Sort: Slide Order (1 to 310)</option>
          <option value="name_asc">Sort: Name (A to Z)</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="pro-table">
          <thead>
            <tr>
              <th>GLOBAL RANK</th>
              <th>SLIDE</th>
              <th>PLAYER NAME</th>
              <th>ROLE</th>
              <th>TIER</th>
              <th>BASE PRICE</th>
              <th>OMNI POINTS</th>
              <th>CAREER STATS</th>
              <th>AUCTION STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const sale = sales[p.overallRank];
              const isUnsold = unsold.includes(p.overallRank);
              const team = sale ? teams.find(t => t.id === sale.teamId) : null;

              const roleClass = p.role === 'BATSMAN' ? 'role-bat' :
                                p.role === 'BOWLER' ? 'role-bowl' :
                                p.role === 'ALL ROUNDER' ? 'role-ar' : 'role-wk';

              return (
                <tr key={p.overallRank}>
                  <td>
                    <div className="rank-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                      #{p.overallRank}
                    </div>
                  </td>

                  <td className="num-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    Slide {p.slideNo}
                  </td>

                  <td>
                    <strong style={{ fontSize: '0.95rem', color: '#FFF' }}>{p.name}</strong>
                  </td>

                  <td>
                    <span className={`role-badge ${roleClass}`}>
                      {p.role}
                    </span>
                  </td>

                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {p.tier}
                  </td>

                  <td className="num-mono" style={{ fontWeight: 600 }}>
                    ₹{p.basePrice.toFixed(2)} Cr
                  </td>

                  <td className="num-mono" style={{ fontWeight: 900, color: '#38BDF8', fontSize: '1.05rem' }}>
                    {p.points}
                  </td>

                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {p.runs > 0 && <span>Runs: {p.runs} (SR: {p.batSR}) </span>}
                    {p.wickets > 0 && <span>Wkts: {p.wickets} (Econ: {p.economy})</span>}
                  </td>

                  <td>
                    {sale ? (
                      <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: '#FDA4AF' }}>
                        Sold: {team?.shortName || 'Team'} (₹{sale.soldPrice.toFixed(2)} Cr)
                      </span>
                    ) : isUnsold ? (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                        Unsold
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7' }}>
                        Available
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onFocusPlayer(p.overallRank)}
                        title="Auction this player"
                      >
                        <Zap size={14} />
                        <span>Auction</span>
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onAddToCompare(p.overallRank)}
                        title="Compare player"
                      >
                        <Scale size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
