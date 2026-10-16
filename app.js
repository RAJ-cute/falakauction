/**
 * FALAK '26 AUCTION COMMAND CENTER
 * Complete State Management, Persistence, Bidding Engine, & Comparison Tool
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'falak26_auction_state_v1';

  // Default IPL / Tournament Teams Setup (100 Cr starting purse)
  const DEFAULT_TEAMS = [
    { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', color: '#FDB913', initialPurse: 100.0 },
    { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0', initialPurse: 100.0 },
    { id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', color: '#D40028', initialPurse: 100.0 },
    { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#3A225D', initialPurse: 100.0 },
    { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', color: '#E83363', initialPurse: 100.0 },
    { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#F26522', initialPurse: 100.0 },
    { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', color: '#0B4973', initialPurse: 100.0 },
    { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#00B2A9', initialPurse: 100.0 },
    { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', color: '#0078BC', initialPurse: 100.0 },
    { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', color: '#ED1B24', initialPurse: 100.0 }
  ];

  // App State
  let state = {
    teams: [...DEFAULT_TEAMS],
    sales: {}, // { [playerOverallRank]: { teamId, soldPrice, timestamp } }
    unsold: [], // [playerOverallRank, ...]
    activityLog: [],
    currentSpotlightRank: 1, // Start with Virat Kohli (Rank 1)
    comparisonRanks: [1, 2], // Start with Kohli and Narine
    selectedTeamTab: 'csk',
    soundEnabled: true,
    deskFilters: {
      search: '',
      role: 'ALL',
      status: 'ALL'
    },
    masterFilters: {
      search: '',
      role: 'ALL',
      tier: 'ALL',
      status: 'ALL',
      sort: 'overallRank_asc'
    }
  };

  // Sound Synthesizer via Web Audio API (Zero external assets needed)
  const soundSynth = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },
    playGavel() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    },
    playSuccess() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.16);
      });
    },
    playAlert() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.setValueAtTime(260, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }
  };

  // State Persistence Helpers
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      }
    } catch (err) {
      console.warn('Could not load saved state, using defaults:', err);
    }
  }

  // Master Data Lookups
  const playersMaster = window.MASTER_PLAYERS || [];
  const playerRankMap = new Map();
  const playerSlideMap = new Map();

  playersMaster.forEach(p => {
    playerRankMap.set(p.overallRank, p);
    playerSlideMap.set(p.slideNo, p);
  });

  function getPlayerByRank(rank) {
    return playerRankMap.get(Number(rank));
  }

  function getPlayerBySlide(slide) {
    return playerSlideMap.get(Number(slide));
  }

  function getPlayerStatus(rank) {
    if (state.sales[rank]) return 'SOLD';
    if (state.unsold.includes(rank)) return 'UNSOLD';
    return 'AVAILABLE';
  }

  function getTeam(teamId) {
    return state.teams.find(t => t.id === teamId);
  }

  // Calculated Team Stats
  function getTeamStats(teamId) {
    const team = getTeam(teamId);
    if (!team) return { purseRemaining: 0, purseSpent: 0, totalPoints: 0, squad: [] };

    let spent = 0;
    let points = 0;
    const squad = [];

    Object.entries(state.sales).forEach(([rankStr, sale]) => {
      if (sale.teamId === teamId) {
        const p = getPlayerByRank(Number(rankStr));
        if (p) {
          spent += sale.soldPrice;
          points += p.points;
          squad.push({
            ...p,
            soldPrice: sale.soldPrice,
            saleTimestamp: sale.timestamp
          });
        }
      }
    });

    // Default sort squad by global overallRank ascending (e.g. Rank 1 first!)
    squad.sort((a, b) => a.overallRank - b.overallRank);

    return {
      team,
      initialPurse: team.initialPurse,
      purseSpent: Number(spent.toFixed(2)),
      purseRemaining: Number((team.initialPurse - spent).toFixed(2)),
      totalPoints: Number(points.toFixed(1)),
      squadCount: squad.length,
      squad
    };
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Setup Modern Dialog Light-Dismiss Fallback (from modern-web-guidance)
  function initDialogDismissFallback(dialog) {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        dialog.close();
      });
    }
  }

  // ==========================================================================
  // RENDER: TOP HEADER TICKER STATS
  // ==========================================================================
  function updateGlobalHeaderStats() {
    const soldCount = Object.keys(state.sales).length;
    const totalPlayers = playersMaster.length;
    
    let totalSpent = 0;
    let totalPoints = 0;

    Object.entries(state.sales).forEach(([rankStr, sale]) => {
      totalSpent += sale.soldPrice;
      const p = getPlayerByRank(Number(rankStr));
      if (p) totalPoints += p.points;
    });

    const soldRatioEl = document.getElementById('statSoldRatio');
    const totalSpentEl = document.getElementById('statTotalSpent');
    const totalPointsEl = document.getElementById('statTotalPoints');

    if (soldRatioEl) soldRatioEl.textContent = `${soldCount} / ${totalPlayers}`;
    if (totalSpentEl) totalSpentEl.textContent = `₹${totalSpent.toFixed(2)} Cr`;
    if (totalPointsEl) totalPointsEl.textContent = `${totalPoints.toFixed(0)} pts`;

    // Also update compare counter badge
    const compareBadge = document.getElementById('compareCounter');
    if (compareBadge) compareBadge.textContent = state.comparisonRanks.length;
  }

  // ==========================================================================
  // RENDER: SPOTLIGHT PLAYER HERO CARD (AUCTION DESK)
  // ==========================================================================
  function renderSpotlightCard() {
    const player = getPlayerByRank(state.currentSpotlightRank) || playersMaster[0];
    if (!player) return;

    state.currentSpotlightRank = player.overallRank;

    const spotlightContainer = document.getElementById('spotlightCard');
    const status = getPlayerStatus(player.overallRank);
    const saleInfo = state.sales[player.overallRank];

    // Status Badge & Info
    let statusBadgeHtml = '';
    if (status === 'SOLD') {
      const buyerTeam = getTeam(saleInfo.teamId);
      const buyerName = buyerTeam ? buyerTeam.shortName : 'TEAM';
      statusBadgeHtml = `<span class="badge badge-danger">SOLD to ${buyerName} for ₹${saleInfo.soldPrice.toFixed(2)} Cr</span>`;
    } else if (status === 'UNSOLD') {
      statusBadgeHtml = `<span class="badge badge-warning">UNSOLD</span>`;
    } else {
      statusBadgeHtml = `<span class="badge badge-success">AVAILABLE</span>`;
    }

    const consoleStatusBadge = document.getElementById('spotlightStatusBadge');
    if (consoleStatusBadge) consoleStatusBadge.innerHTML = statusBadgeHtml;

    // Role css class
    const roleClass = player.role === 'BATSMAN' ? 'bat' :
                      player.role === 'BOWLER' ? 'bowl' :
                      player.role === 'ALL ROUNDER' ? 'ar' : 'wk';

    spotlightContainer.innerHTML = `
      <div class="spotlight-top-strip">
        <div class="spotlight-badges">
          <div class="badge-global-rank" title="Overall Rank in FALAK Master Excel">
            <span>👑 RANK #${player.overallRank}</span>
          </div>
          <div class="badge-role ${roleClass}">
            ${player.role} (Rank #${player.roleRank})
          </div>
          <div class="badge-tier">
            ${player.tier}
          </div>
        </div>
        <div class="badge-slide">
          SLIDE #${player.slideNo} / 310
        </div>
      </div>

      <div class="spotlight-hero-main">
        <div class="spotlight-player-identity">
          <h2>${player.name}</h2>
          <div class="spotlight-player-subinfo">
            <span>Base: <strong>₹${player.basePrice.toFixed(2)} Cr</strong></span>
            <span>•</span>
            <span>Pts/Cr: <strong>${player.pointsPerBaseCr.toFixed(1)}</strong></span>
            <span>•</span>
            <span>Slide: <strong>${player.slideNo}</strong></span>
          </div>
        </div>

        <div class="spotlight-scores-strip">
          <div class="score-box featured-points" title="Omni Points from FALAK Master Points">
            <div class="score-label">OMNI POINTS</div>
            <div class="score-value">${player.points}</div>
          </div>
          <div class="score-box" title="Fantasy Score Metric">
            <div class="score-label">FANTASY</div>
            <div class="score-value" style="color: #A855F7;">${player.fantasyScore}</div>
          </div>
        </div>
      </div>

      <!-- Career Stats Matrix -->
      <div class="spotlight-stats-matrix">
        <div class="stat-cell">
          <span class="stat-cell-title">MATCHES</span>
          <span class="stat-cell-val">${player.matches}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">RUNS</span>
          <span class="stat-cell-val" style="color:#FBBF24;">${player.runs}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">BAT SR</span>
          <span class="stat-cell-val">${player.batSR}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">100s / 50s</span>
          <span class="stat-cell-val">${player.hundreds} / ${player.fifties}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">WICKETS</span>
          <span class="stat-cell-val" style="color:#34D399;">${player.wickets}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">ECONOMY</span>
          <span class="stat-cell-val">${player.economy > 0 ? player.economy : '-'}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">4W / 5W</span>
          <span class="stat-cell-val">${player.fourWHauls} / ${player.fiveWHauls}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-title">CATCHES</span>
          <span class="stat-cell-val">${player.catchesDismissals}</span>
        </div>
      </div>

      <!-- Advanced Scouting Metrics -->
      <div class="scouting-scores-bar">
        <div class="scouting-item"><span>Vol Score:</span> <strong>${player.volScore}</strong></div>
        <div class="scouting-item"><span>Rate Score:</span> <strong>${player.rateScore}</strong></div>
        <div class="scouting-item"><span>Card Eq:</span> <strong>${player.cardEqualScore}</strong></div>
        <div class="scouting-item"><span>Floor (P10):</span> <strong>${player.floorP10}</strong></div>
        <div class="scouting-item"><span>Ceil (P90):</span> <strong>${player.ceilingP90}</strong></div>
      </div>
    `;

    // Update Console Inputs
    const priceInput = document.getElementById('bidPriceInput');
    const teamSelect = document.getElementById('bidTeamSelect');
    const btnSell = document.getElementById('btnSellPlayer');
    const btnUnsold = document.getElementById('btnUnsoldPlayer');
    const btnReopen = document.getElementById('btnReopenBid');
    const slideIndicator = document.getElementById('slideIndicator');

    if (slideIndicator) slideIndicator.textContent = `Rank #${player.overallRank} (Slide ${player.slideNo}/310)`;

    // If already sold, display sale details and allow undo/release
    if (status === 'SOLD') {
      if (priceInput) priceInput.value = saleInfo.soldPrice;
      if (teamSelect) teamSelect.value = saleInfo.teamId;
      if (btnSell) btnSell.style.display = 'none';
      if (btnUnsold) btnUnsold.style.display = 'none';
      if (btnReopen) btnReopen.style.display = 'inline-flex';
    } else {
      if (priceInput) priceInput.value = player.basePrice.toFixed(2);
      if (btnSell) btnSell.style.display = 'inline-flex';
      if (btnUnsold) btnUnsold.style.display = 'inline-flex';
      if (btnReopen) btnReopen.style.display = 'none';
    }

    updateSelectedTeamPreview();
    updateMiniTeamsRadar();
  }

  // ==========================================================================
  // RENDER: TEAMS SELECTOR IN BIDDING CONSOLE
  // ==========================================================================
  function populateTeamSelect() {
    const select = document.getElementById('bidTeamSelect');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select Team --</option>';

    state.teams.forEach(team => {
      const stats = getTeamStats(team.id);
      const opt = document.createElement('option');
      opt.value = team.id;
      opt.textContent = `${team.name} (${team.shortName}) - Purse: ₹${stats.purseRemaining.toFixed(2)} Cr`;
      select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
  }

  function updateSelectedTeamPreview() {
    const select = document.getElementById('bidTeamSelect');
    const preview = document.getElementById('selectedTeamPreview');
    const priceInput = document.getElementById('bidPriceInput');
    const btnSell = document.getElementById('btnSellPlayer');

    if (!select || !preview) return;

    const teamId = select.value;
    const bidPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;

    if (!teamId) {
      preview.innerHTML = `<span class="text-muted">Select a team to verify purse affordability.</span>`;
      if (btnSell) btnSell.disabled = false;
      return;
    }

    const stats = getTeamStats(teamId);
    const affords = stats.purseRemaining >= bidPrice;

    if (affords) {
      const remainingAfter = (stats.purseRemaining - bidPrice).toFixed(2);
      preview.innerHTML = `
        <span style="color: #34D399;">✓ Available Purse: <strong>₹${stats.purseRemaining.toFixed(2)} Cr</strong>. Remaining after bid: <strong>₹${remainingAfter} Cr</strong>.</span>
      `;
      if (btnSell) btnSell.disabled = false;
    } else {
      const deficit = (bidPrice - stats.purseRemaining).toFixed(2);
      preview.innerHTML = `
        <span style="color: #F87171;">⚠️ <strong>INSUFFICIENT PURSE!</strong> Needs ₹${bidPrice.toFixed(2)} Cr but only has ₹${stats.purseRemaining.toFixed(2)} Cr (Deficit: ₹${deficit} Cr).</span>
      `;
      if (btnSell) btnSell.disabled = true;
    }
  }

  // ==========================================================================
  // RENDER: SIDEBAR MINI TEAMS RADAR
  // ==========================================================================
  function updateMiniTeamsRadar() {
    const container = document.getElementById('miniTeamsList');
    if (!container) return;

    container.innerHTML = state.teams.map(team => {
      const stats = getTeamStats(team.id);
      return `
        <div class="mini-team-row" style="border-left-color: ${team.color};" onclick="window.navigateToTeamSquad('${team.id}')">
          <div class="mini-team-left">
            <span class="mini-team-badge" style="background: ${team.color}; color: #000;">${team.shortName}</span>
            <span>${team.name}</span>
          </div>
          <div class="mini-team-purse">₹${stats.purseRemaining.toFixed(2)} Cr</div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // RENDER: DESK SEARCH RESULTS
  // ==========================================================================
  function renderDeskSearchResults() {
    const container = document.getElementById('deskSearchResults');
    if (!container) return;

    const query = state.deskFilters.search.trim().toLowerCase();
    const roleFilter = state.deskFilters.role;
    const statusFilter = state.deskFilters.status;

    let filtered = playersMaster.filter(p => {
      // Role filter
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      // Status filter
      const status = getPlayerStatus(p.overallRank);
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      // Search query
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRank = `#${p.overallRank}` === query || String(p.overallRank) === query;
        const matchesSlide = `slide ${p.slideNo}`.includes(query) || String(p.slideNo) === query;
        return matchesName || matchesRank || matchesSlide;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-2 text-muted text-sm text-center">No players matching filter</div>`;
      return;
    }

    // Limit displayed to 50 for ultra smooth rendering
    const displayList = filtered.slice(0, 50);

    container.innerHTML = displayList.map(p => {
      const isCurrent = p.overallRank === state.currentSpotlightRank;
      const status = getPlayerStatus(p.overallRank);
      let statusDot = status === 'SOLD' ? '🔴' : status === 'UNSOLD' ? '🟠' : '🟢';

      return `
        <div class="search-item ${isCurrent ? 'active' : ''}" data-rank="${p.overallRank}">
          <div class="search-item-left">
            <span class="search-item-rank">#${p.overallRank}</span>
            <span class="search-item-name">${p.name}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span class="search-item-pts">${p.points} pts</span>
            <span title="${status}">${statusDot}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const rank = parseInt(el.dataset.rank, 10);
        state.currentSpotlightRank = rank;
        renderSpotlightCard();
        renderDeskSearchResults();
      });
    });
  }

  // ==========================================================================
  // RENDER: RECENT ACTIVITY LOG
  // ==========================================================================
  function renderActivityLog() {
    const container = document.getElementById('activityFeed');
    if (!container) return;

    if (state.activityLog.length === 0) {
      container.innerHTML = `<div class="empty-state-sm">No players auctioned yet. Start by selling or passing a player!</div>`;
      return;
    }

    // Show last 6 actions reversed
    const recent = state.activityLog.slice(-6).reverse();

    container.innerHTML = recent.map(act => {
      const p = getPlayerByRank(act.playerRank);
      const team = act.teamId ? getTeam(act.teamId) : null;
      const tagClass = act.type === 'SOLD' ? 'badge-success' : act.type === 'UNSOLD' ? 'badge-warning' : 'badge-danger';

      return `
        <div class="activity-item">
          <div class="activity-left">
            <span class="activity-tag ${tagClass}">${act.type}</span>
            <div>
              <strong>#${p ? p.overallRank : act.playerRank} ${p ? p.name : 'Player'}</strong>
              ${team ? `to <span style="color:${team.color}; font-weight:700;">${team.name}</span> for ₹${act.price.toFixed(2)} Cr` : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span class="text-muted text-sm">${act.time || ''}</span>
            ${act.type === 'SOLD' ? `<button class="btn btn-sm btn-ghost text-danger" onclick="window.undoAuctionSale(${act.playerRank})" title="Undo this sale">Undo</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // RENDER: TAB 2 - TEAM SQUADS & PURSES
  // ==========================================================================
  function renderTeamSquadsTab() {
    const navStrip = document.getElementById('teamsNavStrip');
    const dossier = document.getElementById('teamDossier');
    if (!navStrip || !dossier) return;

    // Render navigation strip
    navStrip.innerHTML = state.teams.map(team => {
      const stats = getTeamStats(team.id);
      const isActive = team.id === state.selectedTeamTab;
      return `
        <div class="team-nav-pill ${isActive ? 'active' : ''}" onclick="window.selectTeamTab('${team.id}')">
          <div class="team-badge-circle" style="background: ${team.color};">
            ${team.shortName}
          </div>
          <div class="team-pill-info">
            <span class="team-pill-name">${team.name}</span>
            <div class="team-pill-sub">
              <span>₹${stats.purseRemaining.toFixed(2)} Cr left</span>
              <span>•</span>
              <span style="color:#38BDF8; font-weight:700;">${stats.totalPoints.toFixed(0)} pts</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render active team dossier
    const activeStats = getTeamStats(state.selectedTeamTab);
    const team = activeStats.team;

    // Role counts in squad
    const batCount = activeStats.squad.filter(p => p.role === 'BATSMAN').length;
    const bowlCount = activeStats.squad.filter(p => p.role === 'BOWLER').length;
    const arCount = activeStats.squad.filter(p => p.role === 'ALL ROUNDER').length;
    const wkCount = activeStats.squad.filter(p => p.role === 'WICKET KEEPER').length;

    // Purse percentage spent
    const spentPercent = Math.min(100, (activeStats.purseSpent / activeStats.initialPurse) * 100);

    dossier.innerHTML = `
      <div class="team-dossier-card">
        <div class="team-dossier-header">
          <div class="team-identity-block">
            <div class="team-huge-badge" style="background: ${team.color};">
              ${team.shortName}
            </div>
            <div class="team-title-text">
              <h2>${team.name}</h2>
              <p class="text-muted">Squad Strength: <strong>${activeStats.squadCount} Players</strong> | Total Budget: <strong>₹${activeStats.initialPurse.toFixed(2)} Cr</strong></p>
            </div>
          </div>

          <div class="team-metrics-row">
            <div class="team-metric-box featured-omni">
              <div class="metric-lbl">TOTAL OMNI POINTS</div>
              <div class="metric-val" style="color: #38BDF8;">${activeStats.totalPoints.toFixed(1)}</div>
            </div>
            <div class="team-metric-box">
              <div class="metric-lbl">PURSE REMAINING</div>
              <div class="metric-val highlight-gold">₹${activeStats.purseRemaining.toFixed(2)} Cr</div>
            </div>
            <div class="team-metric-box">
              <div class="metric-lbl">PURSE SPENT</div>
              <div class="metric-val">₹${activeStats.purseSpent.toFixed(2)} Cr</div>
            </div>
          </div>
        </div>

        <!-- Purse Bar -->
        <div class="purse-bar-container">
          <div class="purse-bar-labels">
            <span>Purse Spent: ₹${activeStats.purseSpent.toFixed(2)} Cr (${spentPercent.toFixed(1)}%)</span>
            <span>Available: ₹${activeStats.purseRemaining.toFixed(2)} Cr</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${spentPercent}%;"></div>
          </div>
        </div>
      </div>

      <!-- Squad Roster List -->
      <div class="squad-roster-section">
        <div class="roster-header-row">
          <div>
            <h3>SQUAD PLAYERS (${activeStats.squadCount})</h3>
            <p class="text-muted text-sm">Showing full squad with Global Excel Rank before each player's name.</p>
          </div>
          <div class="roster-role-counters">
            <span class="role-pill-count" style="border-color: var(--role-bat);">🏏 Batsmen: ${batCount}</span>
            <span class="role-pill-count" style="border-color: var(--role-bowl);">⚡ Bowlers: ${bowlCount}</span>
            <span class="role-pill-count" style="border-color: var(--role-ar);">🔄 All-Rounders: ${arCount}</span>
            <span class="role-pill-count" style="border-color: var(--role-wk);">🧤 Wicket Keepers: ${wkCount}</span>
          </div>
        </div>

        <div class="squad-players-container">
          ${activeStats.squad.length === 0 ? `
            <div class="empty-state-sm">
              <p>No players bought yet by ${team.name}.</p>
              <button class="btn btn-sm btn-primary mt-2" onclick="window.navigateToAuctionDesk()">Go to Auction Desk to Bid</button>
            </div>
          ` : activeStats.squad.map(player => {
            const roleClass = player.role === 'BATSMAN' ? 'bat' :
                              player.role === 'BOWLER' ? 'bowl' :
                              player.role === 'ALL ROUNDER' ? 'ar' : 'wk';
            return `
              <div class="squad-player-card">
                <div class="squad-player-left">
                  <!-- Mandatory requirement: Rank #1 before Virat Kohli! -->
                  <div class="squad-player-rank" title="Global Rank in FALAK Excel">
                    Rank #${player.overallRank}
                  </div>
                  <div>
                    <div class="squad-player-name">${player.name}</div>
                    <div class="squad-player-meta">
                      <span class="badge-role ${roleClass}">${player.role} (${player.roleRank})</span>
                      <span>•</span>
                      <span>Base: ₹${player.basePrice.toFixed(2)} Cr</span>
                      <span>•</span>
                      <span>${player.runs > 0 ? `${player.runs} Runs` : ''} ${player.wickets > 0 ? `${player.wickets} Wkts` : ''}</span>
                    </div>
                  </div>
                </div>

                <div class="squad-player-right">
                  <div class="squad-player-points">
                    <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800;">OMNI POINTS</div>
                    <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:800; color:#38BDF8;">${player.points}</div>
                  </div>
                  <div class="squad-player-price">
                    <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800;">SOLD PRICE</div>
                    <div>₹${player.soldPrice.toFixed(2)} Cr</div>
                  </div>
                  <button class="btn btn-sm btn-ghost text-danger" onclick="window.undoAuctionSale(${player.overallRank})" title="Remove from squad">
                    Release ✕
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER: TAB 3 - POINTS LEADERBOARD
  // ==========================================================================
  function renderLeaderboardTab() {
    const tbody = document.getElementById('leaderboardTbody');
    if (!tbody) return;

    // Calculate stats for all teams and sort by total Omni Points descending
    const teamsWithStats = state.teams.map(team => getTeamStats(team.id));
    teamsWithStats.sort((a, b) => b.totalPoints - a.totalPoints || a.purseRemaining - b.purseRemaining);

    tbody.innerHTML = teamsWithStats.map((st, idx) => {
      const rankBadge = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`;
      const ptsPerCr = st.purseSpent > 0 ? (st.totalPoints / st.purseSpent).toFixed(1) : '-';
      
      // Find top scorer
      const topPlayer = st.squad.length > 0 ? [...st.squad].sort((a, b) => b.points - a.points)[0] : null;

      return `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:900; font-size:1.1rem; color:${idx < 3 ? '#FBBF24' : 'inherit'};">
            ${rankBadge}
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem; cursor:pointer;" onclick="window.navigateToTeamSquad('${st.team.id}')">
              <span class="mini-team-badge" style="background:${st.team.color}; color:#000;">${st.team.shortName}</span>
              <strong style="color:#FFF;">${st.team.name}</strong>
            </div>
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">${st.squadCount}</td>
          <td>
            <span style="font-family:var(--font-mono); font-size:1.15rem; font-weight:900; color:#38BDF8;">
              ${st.totalPoints.toFixed(1)} pts
            </span>
          </td>
          <td style="font-family:var(--font-mono);">₹${st.initialPurse.toFixed(2)} Cr</td>
          <td style="font-family:var(--font-mono);">₹${st.purseSpent.toFixed(2)} Cr</td>
          <td style="font-family:var(--font-mono); font-weight:700; color:#FBBF24;">₹${st.purseRemaining.toFixed(2)} Cr</td>
          <td style="font-family:var(--font-mono);">${ptsPerCr}</td>
          <td>
            ${topPlayer ? `<strong>#${topPlayer.overallRank} ${topPlayer.name}</strong> (${topPlayer.points} pts)` : '<span class="text-muted">-</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // RENDER: TAB 4 - PLAYER COMPARISON ARENA
  // ==========================================================================
  function renderComparisonTab() {
    const container = document.getElementById('comparisonMatrix');
    const quickTags = document.getElementById('compareQuickTags');
    if (!container) return;

    // Render quick suggest tags (top marquee players)
    if (quickTags) {
      const topMarquee = [1, 2, 3, 4, 5, 8, 10, 15]; // Virat Kohli, Sunil Narine, Bhuvneshwar Kumar, KL Rahul, etc.
      quickTags.innerHTML = `
        <span class="label-text">Quick Add Marquee:</span>
        ${topMarquee.map(rank => {
          const p = getPlayerByRank(rank);
          if (!p) return '';
          return `
            <button class="compare-quick-btn" onclick="window.addToComparison(${p.overallRank})">
              + #${p.overallRank} ${p.name.split(' ')[0]}
            </button>
          `;
        }).join('')}
      `;
    }

    if (state.comparisonRanks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm py-5 text-center">
          <h3>No players in comparison</h3>
          <p class="text-muted mt-2">Type any player name above or click "Compare" on any player to inspect them side-by-side.</p>
        </div>
      `;
      return;
    }

    const comparedPlayers = state.comparisonRanks.map(rank => getPlayerByRank(rank)).filter(Boolean);

    // Compute best values across compared players to highlight winner
    const maxPoints = Math.max(...comparedPlayers.map(p => p.points));
    const maxRuns = Math.max(...comparedPlayers.map(p => p.runs));
    const maxSR = Math.max(...comparedPlayers.map(p => p.batSR));
    const maxWickets = Math.max(...comparedPlayers.map(p => p.wickets));
    const minEcon = Math.min(...comparedPlayers.map(p => p.economy > 0 ? p.economy : 999));
    const maxFantasy = Math.max(...comparedPlayers.map(p => p.fantasyScore));
    const maxVol = Math.max(...comparedPlayers.map(p => p.volScore));
    const maxRate = Math.max(...comparedPlayers.map(p => p.rateScore));

    container.innerHTML = `
      <div class="comparison-grid">
        ${comparedPlayers.map(player => {
          const roleClass = player.role === 'BATSMAN' ? 'bat' :
                            player.role === 'BOWLER' ? 'bowl' :
                            player.role === 'ALL ROUNDER' ? 'ar' : 'wk';
          const status = getPlayerStatus(player.overallRank);

          return `
            <div class="compare-column-card">
              <button class="btn-remove-compare" onclick="window.removeFromComparison(${player.overallRank})" title="Remove from comparison">✕</button>
              
              <div class="compare-card-header">
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                  <span class="badge-global-rank" style="font-size:0.85rem; padding:0.2rem 0.5rem;">👑 Rank #${player.overallRank}</span>
                  <span class="badge-role ${roleClass}">${player.role}</span>
                </div>
                <h3 style="font-size:1.35rem; font-weight:800; text-transform:uppercase;">${player.name}</h3>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                  Slide #${player.slideNo} • ${player.tier}
                </div>
              </div>

              <div class="compare-metrics-list">
                <!-- Omni Points -->
                <div class="compare-metric-row ${player.points === maxPoints ? 'is-winner' : ''}">
                  <span class="text-muted">OMNI POINTS</span>
                  <span class="metric-val-num" style="color:#38BDF8; font-size:1.15rem;">${player.points} ${player.points === maxPoints ? '👑' : ''}</span>
                </div>

                <!-- Base Price & Points per Base Cr -->
                <div class="compare-metric-row">
                  <span class="text-muted">Base Price</span>
                  <span class="metric-val-num">₹${player.basePrice.toFixed(2)} Cr</span>
                </div>
                <div class="compare-metric-row">
                  <span class="text-muted">Pts / Base Cr</span>
                  <span class="metric-val-num">${player.pointsPerBaseCr.toFixed(1)}</span>
                </div>

                <!-- Fantasy Score -->
                <div class="compare-metric-row ${player.fantasyScore === maxFantasy && maxFantasy > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Fantasy Score</span>
                  <span class="metric-val-num">${player.fantasyScore}</span>
                </div>

                <!-- Matches -->
                <div class="compare-metric-row">
                  <span class="text-muted">Matches</span>
                  <span class="metric-val-num">${player.matches}</span>
                </div>

                <!-- Runs & Strike Rate -->
                <div class="compare-metric-row ${player.runs === maxRuns && maxRuns > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Runs</span>
                  <span class="metric-val-num">${player.runs}</span>
                </div>
                <div class="compare-metric-row ${player.batSR === maxSR && maxSR > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Batting SR</span>
                  <span class="metric-val-num">${player.batSR}</span>
                </div>
                <div class="compare-metric-row">
                  <span class="text-muted">100s / 50s</span>
                  <span class="metric-val-num">${player.hundreds} / ${player.fifties}</span>
                </div>

                <!-- Bowling Stats -->
                <div class="compare-metric-row ${player.wickets === maxWickets && maxWickets > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Wickets</span>
                  <span class="metric-val-num">${player.wickets}</span>
                </div>
                <div class="compare-metric-row ${player.economy > 0 && player.economy === minEcon ? 'is-winner' : ''}">
                  <span class="text-muted">Economy</span>
                  <span class="metric-val-num">${player.economy > 0 ? player.economy : '-'}</span>
                </div>
                <div class="compare-metric-row">
                  <span class="text-muted">4W / 5W Hauls</span>
                  <span class="metric-val-num">${player.fourWHauls} / ${player.fiveWHauls}</span>
                </div>
                <div class="compare-metric-row">
                  <span class="text-muted">Catches / Dismissals</span>
                  <span class="metric-val-num">${player.catchesDismissals}</span>
                </div>

                <!-- Advanced Analytics -->
                <div class="compare-metric-row ${player.volScore === maxVol && maxVol > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Volume Score</span>
                  <span class="metric-val-num">${player.volScore}</span>
                </div>
                <div class="compare-metric-row ${player.rateScore === maxRate && maxRate > 0 ? 'is-winner' : ''}">
                  <span class="text-muted">Rate Score</span>
                  <span class="metric-val-num">${player.rateScore}</span>
                </div>
                <div class="compare-metric-row">
                  <span class="text-muted">Floor (P10) / Ceil (P90)</span>
                  <span class="metric-val-num">${player.floorP10} / ${player.ceilingP90}</span>
                </div>

                <!-- Action Button in Card -->
                <div style="margin-top:0.75rem;">
                  <button class="btn btn-sm btn-primary w-100" style="width:100%;" onclick="window.jumpToAuctionDesk(${player.overallRank})">
                    ⚡ Focus on Auction Desk
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // RENDER: TAB 5 - ALL 310 PLAYERS MASTER ROSTER
  // ==========================================================================
  function renderMasterExplorerTab() {
    const tbody = document.getElementById('masterPlayersTbody');
    const countBadge = document.getElementById('explorerCountBadge');
    if (!tbody) return;

    const query = state.masterFilters.search.trim().toLowerCase();
    const roleFilter = state.masterFilters.role;
    const tierFilter = state.masterFilters.tier;
    const statusFilter = state.masterFilters.status;
    const sortVal = state.masterFilters.sort;

    let filtered = playersMaster.filter(p => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (tierFilter !== 'ALL' && !p.tier.startsWith(tierFilter)) return false;
      
      const status = getPlayerStatus(p.overallRank);
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;

      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRank = `#${p.overallRank}` === query || String(p.overallRank) === query;
        const matchesSlide = String(p.slideNo) === query;
        return matchesName || matchesRank || matchesSlide;
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortVal === 'overallRank_asc') return a.overallRank - b.overallRank;
      if (sortVal === 'points_desc') return b.points - a.points;
      if (sortVal === 'basePrice_desc') return b.basePrice - a.basePrice;
      if (sortVal === 'slideNo_asc') return a.slideNo - b.slideNo;
      if (sortVal === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    if (countBadge) countBadge.textContent = `Showing ${filtered.length} of 310 players`;

    tbody.innerHTML = filtered.map(player => {
      const roleClass = player.role === 'BATSMAN' ? 'bat' :
                        player.role === 'BOWLER' ? 'bowl' :
                        player.role === 'ALL ROUNDER' ? 'ar' : 'wk';
      const status = getPlayerStatus(player.overallRank);
      const sale = state.sales[player.overallRank];

      let statusHtml = '';
      if (status === 'SOLD') {
        const team = getTeam(sale.teamId);
        statusHtml = `<span class="badge badge-danger">Sold: ${team ? team.shortName : 'Team'} (₹${sale.soldPrice.toFixed(2)} Cr)</span>`;
      } else if (status === 'UNSOLD') {
        statusHtml = `<span class="badge badge-warning">Unsold</span>`;
      } else {
        statusHtml = `<span class="badge badge-success">Available</span>`;
      }

      return `
        <tr>
          <td>
            <span class="badge-global-rank" style="font-size:0.85rem; padding:0.2rem 0.6rem;">
              #${player.overallRank}
            </span>
          </td>
          <td style="font-family:var(--font-mono); color:var(--text-dim);">
            Slide ${player.slideNo}
          </td>
          <td>
            <strong style="color:#FFF; font-size:0.95rem; cursor:pointer;" onclick="window.openPlayerDossier(${player.overallRank})">
              ${player.name}
            </strong>
          </td>
          <td>
            <span class="badge-role ${roleClass}">${player.role}</span>
          </td>
          <td style="font-size:0.8rem; color:var(--text-muted);">
            ${player.tier}
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">
            ₹${player.basePrice.toFixed(2)} Cr
          </td>
          <td>
            <span style="font-family:var(--font-mono); font-weight:900; color:#38BDF8; font-size:1.05rem;">
              ${player.points}
            </span>
          </td>
          <td style="font-size:0.8rem; color:var(--text-muted);">
            ${player.runs > 0 ? `Runs: ${player.runs} (SR: ${player.batSR}) ` : ''}
            ${player.wickets > 0 ? `Wkts: ${player.wickets} (Econ: ${player.economy})` : ''}
          </td>
          <td>
            ${statusHtml}
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-sm btn-outline" onclick="window.jumpToAuctionDesk(${player.overallRank})" title="Auction this player">
                🔨 Auction
              </button>
              <button class="btn btn-sm btn-ghost" onclick="window.addToComparison(${player.overallRank})" title="Add to comparison">
                ⚖️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // ACTION HANDLERS: BIDDING & AUCTION FLOW
  // ==========================================================================
  function sellCurrentPlayer() {
    const player = getPlayerByRank(state.currentSpotlightRank);
    if (!player) return;

    const teamSelect = document.getElementById('bidTeamSelect');
    const priceInput = document.getElementById('bidPriceInput');

    const teamId = teamSelect ? teamSelect.value : '';
    const soldPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;

    if (!teamId) {
      showToast('Please select a winning team first!', 'warning');
      soundSynth.playAlert();
      return;
    }

    if (soldPrice <= 0) {
      showToast('Sold price must be greater than zero!', 'warning');
      soundSynth.playAlert();
      return;
    }

    const teamStats = getTeamStats(teamId);
    if (soldPrice > teamStats.purseRemaining) {
      showToast(`Cannot sell! ${teamStats.team.name} only has ₹${teamStats.purseRemaining.toFixed(2)} Cr remaining!`, 'danger');
      soundSynth.playAlert();
      return;
    }

    // Save sale
    state.sales[player.overallRank] = {
      teamId: teamId,
      soldPrice: Number(soldPrice.toFixed(2)),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Remove from unsold list if it was there
    state.unsold = state.unsold.filter(r => r !== player.overallRank);

    // Activity Log
    state.activityLog.push({
      id: Date.now(),
      type: 'SOLD',
      playerRank: player.overallRank,
      teamId: teamId,
      price: soldPrice,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    soundSynth.playGavel();
    showToast(`SOLD! #${player.overallRank} ${player.name} to ${teamStats.team.name} for ₹${soldPrice.toFixed(2)} Cr!`, 'success');

    saveState();
    renderSpotlightCard();
    populateTeamSelect();
    updateGlobalHeaderStats();
    renderActivityLog();
    renderDeskSearchResults();
    renderLeaderboardTab();
    renderTeamSquadsTab();
    renderMasterExplorerTab();

    // Auto-advance to next available player if wanted
    advanceToNextAvailable();
  }

  function markCurrentPlayerUnsold() {
    const player = getPlayerByRank(state.currentSpotlightRank);
    if (!player) return;

    if (!state.unsold.includes(player.overallRank)) {
      state.unsold.push(player.overallRank);
    }
    delete state.sales[player.overallRank];

    state.activityLog.push({
      id: Date.now(),
      type: 'UNSOLD',
      playerRank: player.overallRank,
      teamId: null,
      price: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    soundSynth.playAlert();
    showToast(`Marked #${player.overallRank} ${player.name} as UNSOLD`, 'warning');

    saveState();
    renderSpotlightCard();
    updateGlobalHeaderStats();
    renderActivityLog();
    renderDeskSearchResults();
    renderMasterExplorerTab();

    advanceToNextAvailable();
  }

  function undoAuctionSale(rank) {
    const p = getPlayerByRank(rank);
    if (!p) return;

    const previousSale = state.sales[rank];
    delete state.sales[rank];
    state.unsold = state.unsold.filter(r => r !== rank);

    state.activityLog.push({
      id: Date.now(),
      type: 'UNDO',
      playerRank: rank,
      teamId: previousSale ? previousSale.teamId : null,
      price: 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    showToast(`Released #${p.overallRank} ${p.name} back to Available pool`, 'info');
    soundSynth.playSuccess();

    saveState();
    renderSpotlightCard();
    populateTeamSelect();
    updateGlobalHeaderStats();
    renderActivityLog();
    renderDeskSearchResults();
    renderLeaderboardTab();
    renderTeamSquadsTab();
    renderMasterExplorerTab();
  }

  function advanceToNextAvailable() {
    // Find next player in master list that is still AVAILABLE
    const currentIndex = playersMaster.findIndex(p => p.overallRank === state.currentSpotlightRank);
    for (let i = currentIndex + 1; i < playersMaster.length; i++) {
      if (getPlayerStatus(playersMaster[i].overallRank) === 'AVAILABLE') {
        state.currentSpotlightRank = playersMaster[i].overallRank;
        renderSpotlightCard();
        renderDeskSearchResults();
        return;
      }
    }
  }

  function advanceToPrevPlayer() {
    const currentIndex = playersMaster.findIndex(p => p.overallRank === state.currentSpotlightRank);
    if (currentIndex > 0) {
      state.currentSpotlightRank = playersMaster[currentIndex - 1].overallRank;
      renderSpotlightCard();
      renderDeskSearchResults();
    }
  }

  function advanceToNextPlayer() {
    const currentIndex = playersMaster.findIndex(p => p.overallRank === state.currentSpotlightRank);
    if (currentIndex < playersMaster.length - 1) {
      state.currentSpotlightRank = playersMaster[currentIndex + 1].overallRank;
      renderSpotlightCard();
      renderDeskSearchResults();
    }
  }

  // ==========================================================================
  // COMPARISON ARENA HELPERS
  // ==========================================================================
  function addToComparison(rank) {
    if (!state.comparisonRanks.includes(rank)) {
      if (state.comparisonRanks.length >= 4) {
        state.comparisonRanks.shift(); // Keep max 4
      }
      state.comparisonRanks.push(rank);
      saveState();
      updateGlobalHeaderStats();
      renderComparisonTab();
      showToast(`Added to comparison arena`, 'info');
    }
    // Switch to comparison tab
    switchTab('comparison');
  }

  function removeFromComparison(rank) {
    state.comparisonRanks = state.comparisonRanks.filter(r => r !== rank);
    saveState();
    updateGlobalHeaderStats();
    renderComparisonTab();
  }

  function clearComparison() {
    state.comparisonRanks = [];
    saveState();
    updateGlobalHeaderStats();
    renderComparisonTab();
  }

  // ==========================================================================
  // MODAL: SCOUTING DOSSIER
  // ==========================================================================
  function openPlayerDossier(rank) {
    const player = getPlayerByRank(rank);
    if (!player) return;

    const dialog = document.getElementById('playerModal');
    const body = document.getElementById('playerModalBody');
    const title = document.getElementById('playerModalTitle');

    if (!dialog || !body) return;

    title.textContent = `Scout Dossier: #${player.overallRank} ${player.name}`;
    const roleClass = player.role === 'BATSMAN' ? 'bat' :
                      player.role === 'BOWLER' ? 'bowl' :
                      player.role === 'ALL ROUNDER' ? 'ar' : 'wk';

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <span class="badge-global-rank">👑 Excel Global Rank #${player.overallRank}</span>
          <span class="badge-role ${roleClass} ml-2">${player.role} (Role Rank #${player.roleRank})</span>
          <h2 style="font-size:2rem; font-weight:900; margin-top:0.4rem;">${player.name}</h2>
          <p class="text-muted">Slide #${player.slideNo} • Tier: ${player.tier}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:800;">OMNI POINTS</div>
          <div style="font-family:var(--font-mono); font-size:2.5rem; font-weight:900; color:#38BDF8;">${player.points}</div>
        </div>
      </div>

      <div class="spotlight-stats-matrix">
        <div class="stat-cell"><span class="stat-cell-title">MATCHES</span><span class="stat-cell-val">${player.matches}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">RUNS</span><span class="stat-cell-val" style="color:#FBBF24;">${player.runs}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">BAT SR</span><span class="stat-cell-val">${player.batSR}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">100s/50s</span><span class="stat-cell-val">${player.hundreds}/${player.fifties}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">WICKETS</span><span class="stat-cell-val" style="color:#34D399;">${player.wickets}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">ECONOMY</span><span class="stat-cell-val">${player.economy > 0 ? player.economy : '-'}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">4W/5W</span><span class="stat-cell-val">${player.fourWHauls}/${player.fiveWHauls}</span></div>
        <div class="stat-cell"><span class="stat-cell-title">CATCHES</span><span class="stat-cell-val">${player.catchesDismissals}</span></div>
      </div>

      <div class="scouting-scores-bar mt-3">
        <div class="scouting-item"><span>Vol Score:</span> <strong>${player.volScore}</strong></div>
        <div class="scouting-item"><span>Rate Score:</span> <strong>${player.rateScore}</strong></div>
        <div class="scouting-item"><span>Card Eq:</span> <strong>${player.cardEqualScore}</strong></div>
        <div class="scouting-item"><span>Fantasy Score:</span> <strong>${player.fantasyScore}</strong></div>
        <div class="scouting-item"><span>Floor (P10):</span> <strong>${player.floorP10}</strong></div>
        <div class="scouting-item"><span>Ceil (P90):</span> <strong>${player.ceilingP90}</strong></div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-outline" onclick="window.addToComparison(${player.overallRank}); document.getElementById('playerModal').close();">
          ⚖️ Compare This Player
        </button>
        <button class="btn btn-primary" onclick="window.jumpToAuctionDesk(${player.overallRank}); document.getElementById('playerModal').close();">
          🔨 Auction Now
        </button>
      </div>
    `;

    dialog.showModal();
  }

  // ==========================================================================
  // MODAL: SETTINGS & TEAM MANAGEMENT
  // ==========================================================================
  function openSettingsModal() {
    const dialog = document.getElementById('settingsDialog');
    const list = document.getElementById('teamsEditorList');
    if (!dialog || !list) return;

    list.innerHTML = state.teams.map((team, idx) => `
      <div class="team-editor-row" data-index="${idx}">
        <input type="color" value="${team.color}" class="team-color-input" style="width:100%; height:36px; border:none; background:none; cursor:pointer;">
        <input type="text" value="${team.name}" class="form-control team-name-input" placeholder="Team Name">
        <div style="display:flex; align-items:center; gap:0.25rem;">
          <input type="number" step="1" value="${team.initialPurse}" class="form-control team-purse-input" placeholder="Purse (Cr)">
          <span class="text-muted text-sm">Cr</span>
        </div>
        <button type="button" class="btn btn-sm btn-ghost text-danger" onclick="window.removeTeamRow(${idx})" title="Delete Team">✕</button>
      </div>
    `).join('');

    dialog.showModal();
  }

  function saveTeamsSettings() {
    const rows = document.querySelectorAll('.team-editor-row');
    const newTeams = [];

    rows.forEach((row, i) => {
      const color = row.querySelector('.team-color-input').value;
      const name = row.querySelector('.team-name-input').value.trim() || `Team ${i + 1}`;
      const purse = parseFloat(row.querySelector('.team-purse-input').value) || 100;
      
      const existing = state.teams[i];
      const id = existing ? existing.id : 'team_' + Date.now() + '_' + i;
      const shortName = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();

      newTeams.push({
        id,
        name,
        shortName,
        color,
        initialPurse: purse
      });
    });

    if (newTeams.length === 0) {
      showToast('You must have at least one team!', 'warning');
      return;
    }

    state.teams = newTeams;
    saveState();
    populateTeamSelect();
    updateMiniTeamsRadar();
    renderLeaderboardTab();
    renderTeamSquadsTab();
    showToast('Teams and starting purses updated!', 'success');
    document.getElementById('settingsDialog').close();
  }

  function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `falak26_auction_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Auction backup exported successfully!', 'success');
  }

  function importJSONBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && imported.teams && imported.sales) {
          state = { ...state, ...imported };
          saveState();
          populateTeamSelect();
          renderSpotlightCard();
          updateGlobalHeaderStats();
          renderActivityLog();
          renderDeskSearchResults();
          renderLeaderboardTab();
          renderTeamSquadsTab();
          renderComparisonTab();
          renderMasterExplorerTab();
          showToast('Auction state restored successfully!', 'success');
          document.getElementById('settingsDialog').close();
        } else {
          showToast('Invalid backup file structure!', 'danger');
        }
      } catch (err) {
        showToast('Error parsing backup JSON file!', 'danger');
      }
    };
    reader.readAsText(file);
  }

  function resetAuctionData() {
    if (confirm('⚠️ ARE YOU SURE? This will clear all sold players, unsold records, and reset purses. This action cannot be undone!')) {
      state.sales = {};
      state.unsold = [];
      state.activityLog = [];
      state.currentSpotlightRank = 1;
      state.comparisonRanks = [1, 2];
      saveState();
      populateTeamSelect();
      renderSpotlightCard();
      updateGlobalHeaderStats();
      renderActivityLog();
      renderDeskSearchResults();
      renderLeaderboardTab();
      renderTeamSquadsTab();
      renderComparisonTab();
      renderMasterExplorerTab();
      showToast('Auction reset to pristine state.', 'info');
      document.getElementById('settingsDialog').close();
    }
  }

  function exportSquadsCSV() {
    let csv = "Team,Global_Rank,Player_Name,Role,Tier,Base_Price_Cr,Omni_Points,Sold_Price_Cr\n";
    state.teams.forEach(team => {
      const stats = getTeamStats(team.id);
      stats.squad.forEach(p => {
        csv += `"${team.name}",${p.overallRank},"${p.name}","${p.role}","${p.tier}",${p.basePrice},${p.points},${p.soldPrice}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `falak26_all_team_squads_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('All team squads exported to CSV!', 'success');
  }

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================
  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));

    const tabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const targetSection = tabId === 'auction-desk' ? document.getElementById('secAuctionDesk') :
                          tabId === 'team-squads' ? document.getElementById('secTeamSquads') :
                          tabId === 'leaderboard' ? document.getElementById('secLeaderboard') :
                          tabId === 'comparison' ? document.getElementById('secComparison') :
                          document.getElementById('secMasterExplorer');

    if (tabBtn) tabBtn.classList.add('active');
    if (targetSection) targetSection.classList.add('active');

    // Trigger specific render updates on tab switch
    if (tabId === 'team-squads') renderTeamSquadsTab();
    if (tabId === 'leaderboard') renderLeaderboardTab();
    if (tabId === 'comparison') renderComparisonTab();
    if (tabId === 'master-explorer') renderMasterExplorerTab();
    if (tabId === 'auction-desk') {
      renderSpotlightCard();
      renderDeskSearchResults();
    }
  }

  // ==========================================================================
  // GLOBAL WINDOW BRIDGES FOR INLINE HTML CALLS
  // ==========================================================================
  window.navigateToAuctionDesk = () => switchTab('auction-desk');
  window.navigateToTeamSquad = (teamId) => {
    state.selectedTeamTab = teamId;
    switchTab('team-squads');
  };
  window.selectTeamTab = (teamId) => {
    state.selectedTeamTab = teamId;
    renderTeamSquadsTab();
  };
  window.undoAuctionSale = undoAuctionSale;
  window.addToComparison = addToComparison;
  window.removeFromComparison = removeFromComparison;
  window.openPlayerDossier = openPlayerDossier;
  window.jumpToAuctionDesk = (rank) => {
    state.currentSpotlightRank = rank;
    switchTab('auction-desk');
  };
  window.removeTeamRow = (index) => {
    const rows = document.querySelectorAll('.team-editor-row');
    if (rows[index]) rows[index].remove();
  };

  // ==========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================================================
  function initApp() {
    loadState();

    // Tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Populate and render
    populateTeamSelect();
    renderSpotlightCard();
    updateGlobalHeaderStats();
    renderDeskSearchResults();
    renderActivityLog();
    updateMiniTeamsRadar();

    // Init Modern Web Guidance Light Dismiss Fallbacks on dialogs
    document.querySelectorAll('dialog').forEach(initDialogDismissFallback);

    // Desk Search & Clear
    const deskSearchInput = document.getElementById('deskSearchInput');
    const deskSearchClear = document.getElementById('deskSearchClear');
    if (deskSearchInput) {
      deskSearchInput.addEventListener('input', (e) => {
        state.deskFilters.search = e.target.value;
        if (deskSearchClear) deskSearchClear.style.display = e.target.value ? 'block' : 'none';
        renderDeskSearchResults();
      });
    }
    if (deskSearchClear) {
      deskSearchClear.addEventListener('click', () => {
        if (deskSearchInput) deskSearchInput.value = '';
        state.deskFilters.search = '';
        deskSearchClear.style.display = 'none';
        renderDeskSearchResults();
      });
    }

    // Role & Status chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.deskFilters.role = chip.dataset.role;
        renderDeskSearchResults();
      });
    });

    document.querySelectorAll('.status-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.status-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.deskFilters.status = chip.dataset.status;
        renderDeskSearchResults();
      });
    });

    // Prev / Next Navigation
    const btnPrev = document.getElementById('btnPrevPlayer');
    const btnNext = document.getElementById('btnNextPlayer');
    if (btnPrev) btnPrev.addEventListener('click', advanceToPrevPlayer);
    if (btnNext) btnNext.addEventListener('click', advanceToNextPlayer);

    // Jump to Slide
    const btnJump = document.getElementById('btnJumpSlide');
    const jumpInput = document.getElementById('jumpSlideInput');
    if (btnJump && jumpInput) {
      btnJump.addEventListener('click', () => {
        const slideNo = parseInt(jumpInput.value, 10);
        const p = getPlayerBySlide(slideNo);
        if (p) {
          state.currentSpotlightRank = p.overallRank;
          renderSpotlightCard();
          renderDeskSearchResults();
        } else {
          showToast('Invalid slide number (must be 1-310)', 'warning');
        }
      });
    }

    // Quick Increment buttons
    document.querySelectorAll('.btn-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const inc = parseFloat(btn.dataset.inc);
        const priceInput = document.getElementById('bidPriceInput');
        if (priceInput && inc) {
          const current = parseFloat(priceInput.value) || 0;
          priceInput.value = (current + inc).toFixed(2);
          updateSelectedTeamPreview();
        }
      });
    });

    const btnResetBase = document.getElementById('btnResetToBase');
    if (btnResetBase) {
      btnResetBase.addEventListener('click', () => {
        const player = getPlayerByRank(state.currentSpotlightRank);
        const priceInput = document.getElementById('bidPriceInput');
        if (player && priceInput) {
          priceInput.value = player.basePrice.toFixed(2);
          updateSelectedTeamPreview();
        }
      });
    }

    // Team Select & Price Input Changes
    const bidTeamSelect = document.getElementById('bidTeamSelect');
    const bidPriceInput = document.getElementById('bidPriceInput');
    if (bidTeamSelect) bidTeamSelect.addEventListener('change', updateSelectedTeamPreview);
    if (bidPriceInput) bidPriceInput.addEventListener('input', updateSelectedTeamPreview);

    // Bidding Action Buttons
    const btnSell = document.getElementById('btnSellPlayer');
    const btnUnsold = document.getElementById('btnUnsoldPlayer');
    const btnReopen = document.getElementById('btnReopenBid');
    const btnCompare = document.getElementById('btnAddToCompare');

    if (btnSell) btnSell.addEventListener('click', sellCurrentPlayer);
    if (btnUnsold) btnUnsold.addEventListener('click', markCurrentPlayerUnsold);
    if (btnReopen) btnReopen.addEventListener('click', () => undoAuctionSale(state.currentSpotlightRank));
    if (btnCompare) btnCompare.addEventListener('click', () => addToComparison(state.currentSpotlightRank));

    // Comparison Search Autocomplete
    const compareSearchInput = document.getElementById('compareSearchInput');
    const compareSuggestions = document.getElementById('compareSuggestions');
    if (compareSearchInput && compareSuggestions) {
      compareSearchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
          compareSuggestions.style.display = 'none';
          return;
        }

        const matches = playersMaster.filter(p => 
          p.name.toLowerCase().includes(q) || `#${p.overallRank}` === q
        ).slice(0, 10);

        if (matches.length === 0) {
          compareSuggestions.innerHTML = `<div class="p-2 text-muted text-sm text-center">No matching players</div>`;
        } else {
          compareSuggestions.innerHTML = matches.map(p => `
            <div class="search-item" onclick="window.addToComparison(${p.overallRank}); document.getElementById('compareSuggestions').style.display='none'; document.getElementById('compareSearchInput').value='';">
              <div class="search-item-left">
                <span class="search-item-rank">#${p.overallRank}</span>
                <span class="search-item-name">${p.name}</span>
                <span class="badge-role ${p.role === 'BATSMAN' ? 'bat' : p.role === 'BOWLER' ? 'bowl' : p.role === 'ALL ROUNDER' ? 'ar' : 'wk'} text-sm">${p.role}</span>
              </div>
              <span class="search-item-pts">${p.points} pts</span>
            </div>
          `).join('');
        }
        compareSuggestions.style.display = 'block';
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!compareSearchInput.contains(e.target) && !compareSuggestions.contains(e.target)) {
          compareSuggestions.style.display = 'none';
        }
      });
    }

    const btnClearCompare = document.getElementById('btnClearComparison');
    if (btnClearCompare) btnClearCompare.addEventListener('click', clearComparison);

    // Master Explorer Filters
    const masterSearch = document.getElementById('masterSearchInput');
    const masterRole = document.getElementById('masterRoleSelect');
    const masterTier = document.getElementById('masterTierSelect');
    const masterStatus = document.getElementById('masterStatusSelect');
    const masterSort = document.getElementById('masterSortSelect');

    const triggerMasterFilter = () => {
      if (masterSearch) state.masterFilters.search = masterSearch.value;
      if (masterRole) state.masterFilters.role = masterRole.value;
      if (masterTier) state.masterFilters.tier = masterTier.value;
      if (masterStatus) state.masterFilters.status = masterStatus.value;
      if (masterSort) state.masterFilters.sort = masterSort.value;
      renderMasterExplorerTab();
    };

    if (masterSearch) masterSearch.addEventListener('input', triggerMasterFilter);
    if (masterRole) masterRole.addEventListener('change', triggerMasterFilter);
    if (masterTier) masterTier.addEventListener('change', triggerMasterFilter);
    if (masterStatus) masterStatus.addEventListener('change', triggerMasterFilter);
    if (masterSort) masterSort.addEventListener('change', triggerMasterFilter);

    // Header Buttons
    const btnToggleSound = document.getElementById('btnToggleSound');
    const soundIcon = document.getElementById('soundIcon');
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        if (soundIcon) soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
        btnToggleSound.innerHTML = `<span id="soundIcon">${state.soundEnabled ? '🔊' : '🔇'}</span> Sound ${state.soundEnabled ? 'ON' : 'OFF'}`;
        showToast(`Sound ${state.soundEnabled ? 'Enabled' : 'Muted'}`, 'info');
      });
    }

    const btnQuickBackup = document.getElementById('btnQuickBackup');
    if (btnQuickBackup) btnQuickBackup.addEventListener('click', exportJSONBackup);

    const btnOpenSettings = document.getElementById('btnOpenSettings');
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);

    const btnCloseSettings = document.getElementById('btnCloseSettingsModal');
    const btnCancelSettings = document.getElementById('btnCancelSettings');
    const settingsDialog = document.getElementById('settingsDialog');
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => settingsDialog.close());
    if (btnCancelSettings) btnCancelSettings.addEventListener('click', () => settingsDialog.close());

    const btnClosePlayerModal = document.getElementById('btnClosePlayerModal');
    const playerModal = document.getElementById('playerModal');
    if (btnClosePlayerModal) btnClosePlayerModal.addEventListener('click', () => playerModal.close());

    // Settings actions
    const btnSaveSettings = document.getElementById('btnSaveTeamsSettings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveTeamsSettings);

    const btnAddTeamRow = document.getElementById('btnAddTeamRow');
    if (btnAddTeamRow) {
      btnAddTeamRow.addEventListener('click', () => {
        const list = document.getElementById('teamsEditorList');
        const count = list.children.length;
        const div = document.createElement('div');
        div.className = 'team-editor-row';
        div.dataset.index = count;
        div.innerHTML = `
          <input type="color" value="#38BDF8" class="team-color-input" style="width:100%; height:36px; border:none; background:none; cursor:pointer;">
          <input type="text" value="New Team ${count + 1}" class="form-control team-name-input" placeholder="Team Name">
          <div style="display:flex; align-items:center; gap:0.25rem;">
            <input type="number" step="1" value="100" class="form-control team-purse-input" placeholder="Purse (Cr)">
            <span class="text-muted text-sm">Cr</span>
          </div>
          <button type="button" class="btn btn-sm btn-ghost text-danger" onclick="this.closest('.team-editor-row').remove()">✕</button>
        `;
        list.appendChild(div);
      });
    }

    const btnExportJSON = document.getElementById('btnExportJSON');
    if (btnExportJSON) btnExportJSON.addEventListener('click', exportJSONBackup);

    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) importFileInput.addEventListener('change', importJSONBackup);

    const btnReset = document.getElementById('btnResetAuction');
    if (btnReset) btnReset.addEventListener('click', resetAuctionData);

    const btnExportCSV = document.getElementById('btnExportSquadsCSV');
    if (btnExportCSV) btnExportCSV.addEventListener('click', exportSquadsCSV);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
