import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TeamSetup from './components/TeamSetup';
import AuctionDesk from './components/AuctionDesk';
import TeamSquads from './components/TeamSquads';
import PlayerComparison from './components/PlayerComparison';
import Leaderboard from './components/Leaderboard';
import PlayerExplorer from './components/PlayerExplorer';
import { MASTER_PLAYERS } from './data/players';
import { Shield, Zap, Users, Scale, Trophy, List } from 'lucide-react';

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

export default function App() {
  // Load initial state with complete localStorage persistence
  const [teams, setTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_teams');
      return saved ? JSON.parse(saved) : DEFAULT_TEAMS;
    } catch {
      return DEFAULT_TEAMS;
    }
  });

  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_sales');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [unsold, setUnsold] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_unsold');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activityLog, setActivityLog] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_activity');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentRank, setCurrentRank] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_currentRank');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  const [comparisonRanks, setComparisonRanks] = useState(() => {
    try {
      const saved = localStorage.getItem('falak26_compare');
      return saved ? JSON.parse(saved) : [1, 2];
    } catch {
      return [1, 2];
    }
  });

  const [selectedSquadTeamId, setSelectedSquadTeamId] = useState('');
  const [activeTab, setActiveTab] = useState('auction'); // Default to Auction Desk, Team Setup accessible via tab 1

  // Automatic Persistence Effects - Saves instantly without needing manual export!
  useEffect(() => {
    try { localStorage.setItem('falak26_teams', JSON.stringify(teams)); } catch (e) { console.error(e); }
  }, [teams]);

  useEffect(() => {
    try { localStorage.setItem('falak26_sales', JSON.stringify(sales)); } catch (e) { console.error(e); }
  }, [sales]);

  useEffect(() => {
    try { localStorage.setItem('falak26_unsold', JSON.stringify(unsold)); } catch (e) { console.error(e); }
  }, [unsold]);

  useEffect(() => {
    try { localStorage.setItem('falak26_activity', JSON.stringify(activityLog)); } catch (e) { console.error(e); }
  }, [activityLog]);

  useEffect(() => {
    try { localStorage.setItem('falak26_currentRank', String(currentRank)); } catch (e) { console.error(e); }
  }, [currentRank]);

  useEffect(() => {
    try { localStorage.setItem('falak26_compare', JSON.stringify(comparisonRanks)); } catch (e) { console.error(e); }
  }, [comparisonRanks]);

  // Calculated Team Stats
  const getTeamStats = (teamId) => {
    const team = teams.find(t => t.id === teamId) || { id: teamId, name: 'Team', shortName: 'TM', color: '#38BDF8', initialPurse: 100 };
    let spent = 0;
    let points = 0;
    const squad = [];

    Object.entries(sales).forEach(([rankStr, sale]) => {
      if (sale.teamId === teamId) {
        const p = MASTER_PLAYERS.find(x => x.overallRank === Number(rankStr));
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

    squad.sort((a, b) => a.overallRank - b.overallRank);

    return {
      team,
      initialPurse: team.initialPurse || 100,
      purseSpent: Number(spent.toFixed(2)),
      purseRemaining: Number(((team.initialPurse || 100) - spent).toFixed(2)),
      totalPoints: Number(points.toFixed(1)),
      squadCount: squad.length,
      squad
    };
  };

  // Auction Actions
  const handleSellPlayer = (rank, teamId, price) => {
    const p = MASTER_PLAYERS.find(x => x.overallRank === rank);
    const newSales = {
      ...sales,
      [rank]: {
        teamId,
        soldPrice: price,
        points: p ? p.points : 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    };
    setSales(newSales);
    setUnsold(unsold.filter(r => r !== rank));

    setActivityLog([
      ...activityLog,
      {
        id: Date.now(),
        type: 'SOLD',
        playerRank: rank,
        teamId,
        price,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Automatically advance to the next available player
    const currIdx = MASTER_PLAYERS.findIndex(x => x.overallRank === rank);
    for (let i = currIdx + 1; i < MASTER_PLAYERS.length; i++) {
      if (!newSales[MASTER_PLAYERS[i].overallRank] && !unsold.includes(MASTER_PLAYERS[i].overallRank)) {
        setCurrentRank(MASTER_PLAYERS[i].overallRank);
        break;
      }
    }
  };

  const handleMarkUnsold = (rank) => {
    if (!unsold.includes(rank)) {
      setUnsold([...unsold, rank]);
    }
    const newSales = { ...sales };
    delete newSales[rank];
    setSales(newSales);

    setActivityLog([
      ...activityLog,
      {
        id: Date.now(),
        type: 'UNSOLD',
        playerRank: rank,
        teamId: null,
        price: 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Advance to next available player
    const currIdx = MASTER_PLAYERS.findIndex(x => x.overallRank === rank);
    for (let i = currIdx + 1; i < MASTER_PLAYERS.length; i++) {
      if (!newSales[MASTER_PLAYERS[i].overallRank] && !unsold.includes(MASTER_PLAYERS[i].overallRank)) {
        setCurrentRank(MASTER_PLAYERS[i].overallRank);
        break;
      }
    }
  };

  const handleUndoSale = (rank) => {
    const newSales = { ...sales };
    delete newSales[rank];
    setSales(newSales);
    setUnsold(unsold.filter(r => r !== rank));

    setActivityLog([
      ...activityLog,
      {
        id: Date.now(),
        type: 'UNDO',
        playerRank: rank,
        teamId: null,
        price: 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleResetAuction = () => {
    if (confirm('⚠️ RESET AUCTION: Are you sure you want to clear all sales, unsold marks, and activity history? This cannot be undone.')) {
      setSales({});
      setUnsold([]);
      setActivityLog([]);
      setCurrentRank(1);
      setComparisonRanks([1, 2]);
    }
  };

  const handleFocusPlayerInDesk = (rank) => {
    setCurrentRank(rank);
    setActiveTab('auction');
  };

  const handleAddToCompare = (rank) => {
    if (!comparisonRanks.includes(rank)) {
      if (comparisonRanks.length >= 4) {
        setComparisonRanks([...comparisonRanks.slice(1), rank]);
      } else {
        setComparisonRanks([...comparisonRanks, rank]);
      }
    }
    setActiveTab('comparison');
  };

  const handleSelectSquadTeam = (teamId) => {
    setSelectedSquadTeamId(teamId);
    setActiveTab('squads');
  };

  return (
    <div className="app-container">
      {/* Top Header with Global Search */}
      <Header 
        players={MASTER_PLAYERS}
        onSelectPlayer={handleFocusPlayerInDesk}
        sales={sales}
        unsold={unsold}
        onResetAuction={handleResetAuction}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teamsCount={teams.length}
        compareCount={comparisonRanks.length}
      />

      {/* Modern Navigation Tabs Strip */}
      <nav className="nav-strip">
        <button 
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Shield size={16} />
          <span>Team Setup</span>
          <span className="tab-counter">{teams.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'auction' ? 'active' : ''}`}
          onClick={() => setActiveTab('auction')}
        >
          <Zap size={16} />
          <span>Auction Desk</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'squads' ? 'active' : ''}`}
          onClick={() => setActiveTab('squads')}
        >
          <Users size={16} />
          <span>Team Squads & Purses</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <Scale size={16} />
          <span>Player Comparison</span>
          {comparisonRanks.length > 0 && <span className="tab-counter">{comparisonRanks.length}</span>}
        </button>

        <button 
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={16} />
          <span>Points Leaderboard</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          <List size={16} />
          <span>All 310 Players</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'teams' && (
          <TeamSetup 
            teams={teams}
            setTeams={setTeams}
            onProceedToAuction={() => setActiveTab('auction')}
            getTeamStats={getTeamStats}
          />
        )}

        {activeTab === 'auction' && (
          <AuctionDesk 
            players={MASTER_PLAYERS}
            currentRank={currentRank}
            setCurrentRank={setCurrentRank}
            teams={teams}
            sales={sales}
            unsold={unsold}
            onSellPlayer={handleSellPlayer}
            onMarkUnsold={handleMarkUnsold}
            onUndoSale={handleUndoSale}
            onAddToCompare={handleAddToCompare}
            activityLog={activityLog}
            getTeamStats={getTeamStats}
          />
        )}

        {activeTab === 'squads' && (
          <TeamSquads 
            teams={teams}
            selectedTeamId={selectedSquadTeamId || (teams[0] ? teams[0].id : '')}
            setSelectedTeamId={setSelectedSquadTeamId}
            getTeamStats={getTeamStats}
            onUndoSale={handleUndoSale}
            onNavigateToDesk={() => setActiveTab('auction')}
            onFocusPlayer={handleFocusPlayerInDesk}
          />
        )}

        {activeTab === 'comparison' && (
          <PlayerComparison 
            players={MASTER_PLAYERS}
            comparisonRanks={comparisonRanks}
            setComparisonRanks={setComparisonRanks}
            onFocusPlayerInDesk={handleFocusPlayerInDesk}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard 
            teams={teams}
            getTeamStats={getTeamStats}
            onSelectTeam={handleSelectSquadTeam}
            onUndoSale={handleUndoSale}
            onFocusPlayer={handleFocusPlayerInDesk}
          />
        )}

        {activeTab === 'explorer' && (
          <PlayerExplorer 
            players={MASTER_PLAYERS}
            sales={sales}
            unsold={unsold}
            teams={teams}
            onFocusPlayer={handleFocusPlayerInDesk}
            onAddToCompare={handleAddToCompare}
          />
        )}
      </main>
    </div>
  );
}
