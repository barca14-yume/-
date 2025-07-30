import React from 'react';

// records: 全試合の記録配列
// 表示するフィールド: 勝ち, 負け, 引き分け, 公式戦, 交流戦, 得点, 失点
// 勝敗はrec.result, 試合種別はrec.matchType, 得点/失点はrec.teamScore/opponentScoreを想定
function TeamSummary({ records, matchTypeFilter, onMatchTypeFilterChange }) {
  // 各試合ごとにまとめる（date+opponentで1試合とみなす）
  const games = {};
  records.forEach(rec => {
    if (!rec.date || !rec.opponent) return;
    if (matchTypeFilter && rec.matchType !== matchTypeFilter) return;
    const key = `${rec.date}_${rec.opponent}`;
    if (!games[key]) {
      games[key] = {
        matchType: rec.matchType || '',
        result: rec.gameResult || '',
        teamScore: Number(rec.teamScore || 0),
        opponentScore: Number(rec.opponentScore || 0),
      };
    }
  });
  const gameList = Object.values(games);
  const summary = {
    win: gameList.filter(g => g.result === '勝ち').length,
    lose: gameList.filter(g => g.result === '負け').length,
    draw: gameList.filter(g => g.result === '引き分け').length,
    official: gameList.filter(g => g.matchType === '公式戦').length,
    friendly: gameList.filter(g => g.matchType === '交流戦').length,
    teamScore: gameList.reduce((sum, g) => sum + g.teamScore, 0),
    opponentScore: gameList.reduce((sum, g) => sum + g.opponentScore, 0),
    total: gameList.length,
  };
  return (
    <div className="mb-3">
      <h5>チーム戦績サマリ</h5>
      <div className="d-flex align-items-center mb-2">
        <span className="me-2">試合種別:</span>
        <select className="form-select form-select-sm w-auto" value={matchTypeFilter} onChange={e => onMatchTypeFilterChange(e.target.value)}>
          <option value="">全て</option>
          <option value="公式戦">公式戦</option>
          <option value="交流戦">交流戦</option>
        </select>
      </div>
      <table className="table table-bordered w-auto mb-0">
        <thead><tr>
          <th>試合数</th>
          <th>勝ち</th>
          <th>負け</th>
          <th>引き分け</th>
          <th>公式戦</th>
          <th>交流戦</th>
          <th>総得点</th>
          <th>総失点</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>{summary.total}</td>
            <td>{summary.win}</td>
            <td>{summary.lose}</td>
            <td>{summary.draw}</td>
            <td>{summary.official}</td>
            <td>{summary.friendly}</td>
            <td>{summary.teamScore}</td>
            <td>{summary.opponentScore}</td>
          </tr>
        </tbody>
      </table>
      <span className="text-secondary small">※「gameResult」「matchType」「teamScore」「opponentScore」列がCSVに必要です</span>
    </div>
  );
}

export default TeamSummary;
