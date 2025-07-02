import React from 'react';
import { useParams, Link } from 'react-router-dom';

function PlayerDetail({ players, stats, records }) {
  const { playerName } = useParams();
  const playerStats = stats[playerName];
  const playerRecords = records.filter(r => r.player === playerName);

  if (!playerStats) {
    return (
      <div className="mt-4">
        <h3>{playerName} のデータはありません</h3>
        <Link to="/">← 戻る</Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3>{playerName} の個人成績</h3>
      <table className="table table-bordered w-auto">
        <tbody>
          <tr><th>打席</th><td>{playerStats.pa}</td></tr>
          <tr><th>打数</th><td>{playerStats.ab}</td></tr>
          <tr><th>安打</th><td>{playerStats.h}</td></tr>
          <tr><th>単打</th><td>{playerStats.single}</td></tr>
          <tr><th>内野安打</th><td>{playerStats.infieldHit}</td></tr>
          <tr><th>二塁打</th><td>{playerStats.double}</td></tr>
          <tr><th>三塁打</th><td>{playerStats.triple}</td></tr>
          <tr><th>本塁打</th><td>{playerStats.hr}</td></tr>
          <tr><th>打率</th><td>{playerStats.avg}</td></tr>
          <tr><th>出塁率</th><td>{playerStats.obp}</td></tr>
          <tr><th>打点</th><td>{playerStats.rbi}</td></tr>
          <tr><th>得点</th><td>{playerStats.run}</td></tr>
          <tr><th>盗塁</th><td>{playerStats.sb}</td></tr>
        </tbody>
      </table>
      <h5 className="mt-4">試合ごとの成績</h5>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>日付</th><th>対戦相手</th><th>打席</th><th>打数</th><th>結果</th><th>安打種類</th>
<th>打球方向</th><th>打点</th><th>得点</th>
          </tr>
        </thead>
        <tbody>
          {playerRecords.map((rec, i) => (
            <tr key={i}>
              <td>{rec.date}</td>
              <td>{rec.opponent}</td>
              <td>{rec.pa}</td>
              <td>{rec.ab}</td>
              <td>{rec.result}</td>
              <td>{rec.hitType}</td>
<td>{rec.battedDirection}</td>
              <td>{rec.rbi}</td>
              <td>{rec.run}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/">← 戻る</Link>
    </div>
  );
}

export default PlayerDetail;
