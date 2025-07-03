import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PlayerDetail from './PlayerDetail';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const initialForm = {
  player: '',
  opponent: '',
  date: '',
  pa: '',      // 打席
  ab: '',      // 打数
  result: '',  // 打席結果
  hitType: '', // 安打種類
  rbi: '',
  run: '',
  sb: '',      // 盗塁
  position: '',// 守備位置
  error: ''    // 失策
};

const defaultPlayers = [
  '山田',
  '佐藤',
  '鈴木',
  '田中',
];

function calcStats(records) {
  // 選手ごとに集計
  const stats = {};
  records.forEach((rec) => {
    if (!stats[rec.player]) {
      stats[rec.player] = {
        pa: 0, // 打席
        ab: 0, // 打数
        h: 0,  // 安打
        bb: 0, // 四球
        hbp: 0, // 死球
        so: 0, // 三振
        swingSo: 0, // 空振三振
        lookingSo: 0, // 見逃三振
        rbi: 0, // 打点
        run: 0, // 得点
        single: 0, // 単打
        infieldHit: 0, // 内野安打
        double: 0, // 二塁打
        triple: 0, // 三塁打
        hr: 0,     // 本塁打
        sb: 0,     // 盗塁
        error: 0,  // 失策
        position: '', // 守備位置（最新値のみ）
      };
    }
    // 打席
    if (rec.result === '四球' || rec.result === '死球') {
      stats[rec.player].pa += 1;
    } else {
      stats[rec.player].pa += Number(rec.pa || 1);
    }
    // 打数
    if (rec.result === '四球' || rec.result === '死球') {
      // 打数カウントしない
    } else {
      stats[rec.player].ab += Number(rec.ab || 1);
    }
    // 安打種類
    if (rec.result === 'ヒット') {
      stats[rec.player].h += 1;
      if (rec.hitType === '単打') stats[rec.player].single += 1;
      if (rec.hitType === '内野安打') stats[rec.player].infieldHit += 1;
      if (rec.hitType === '二塁打') stats[rec.player].double += 1;
      if (rec.hitType === '三塁打') stats[rec.player].triple += 1;
      if (rec.hitType === '本塁打') stats[rec.player].hr += 1;
    } else if (rec.result === '四球') {
      stats[rec.player].bb += 1;
    } else if (rec.result === '死球') {
      stats[rec.player].hbp += 1;
    } else if (rec.result === '三振') {
      stats[rec.player].so += 1;
    } else if (rec.result === '空振三振') {
      stats[rec.player].so += 1;
      stats[rec.player].swingSo += 1;
    } else if (rec.result === '見逃三振') {
      stats[rec.player].so += 1;
      stats[rec.player].lookingSo += 1;
    }
    // 打点
    stats[rec.player].rbi += Number(rec.rbi || 0);
    // 得点
    stats[rec.player].run += Number(rec.run || 0);
    // 盗塁
    stats[rec.player].sb += Number(rec.sb || 0);
    // 失策
    stats[rec.player].error += Number(rec.error || 0);
    // 守備位置（最新値を記録）
    if (rec.position) stats[rec.player].position = rec.position;
  });
  // 出塁率・打率計算
  Object.values(stats).forEach((s) => {
    s.avg = s.ab > 0 ? (s.h / s.ab).toFixed(3) : '-';
    // 四球・死球も出塁率に含める
    s.obp = (s.ab + s.bb + s.hbp) > 0 ? ((s.h + s.bb + s.hbp) / (s.ab + s.bb + s.hbp)).toFixed(3) : '-';
  });
  return stats;
} 

// 投手成績用初期データ
const initialPitcherForm = {
  pitcher: '', opponent: '', date: '', innings: '', pitches: '', batters: '', hits: '', hr: '', so: '', bb: '', hbp: '', wp: '', pb: '', bk: '', runs: '', er: ''
};

function calcPitcherStats(records) {
  const stats = {};
  records.forEach((rec) => {
    if (!stats[rec.pitcher]) {
      stats[rec.pitcher] = {
        innings: 0, pitches: 0, batters: 0, hits: 0, hr: 0, so: 0, bb: 0, hbp: 0, wp: 0, pb: 0, bk: 0, runs: 0, er: 0
      };
    }
    stats[rec.pitcher].innings += Number(rec.innings || 0);
    stats[rec.pitcher].pitches += Number(rec.pitches || 0);
    stats[rec.pitcher].batters += Number(rec.batters || 0);
    stats[rec.pitcher].hits += Number(rec.hits || 0);
    stats[rec.pitcher].hr += Number(rec.hr || 0);
    stats[rec.pitcher].so += Number(rec.so || 0);
    stats[rec.pitcher].bb += Number(rec.bb || 0);
    stats[rec.pitcher].hbp += Number(rec.hbp || 0);
    stats[rec.pitcher].wp += Number(rec.wp || 0);
    stats[rec.pitcher].pb += Number(rec.pb || 0);
    stats[rec.pitcher].bk += Number(rec.bk || 0);
    stats[rec.pitcher].runs += Number(rec.runs || 0);
    stats[rec.pitcher].er += Number(rec.er || 0);
  });
  return stats;
}

// 投球回合計を0.1=1/3, 0.2=2/3, 0.3で1回繰り上げで集計して表示
function formatInningsSum(inningsArr) {
  let total = 0;
  let fraction = 0;
  inningsArr.forEach(val => {
    const n = Number(val) || 0;
    const intPart = Math.floor(n);
    let fracPart = Math.round((n - intPart) * 10); // 0,1,2
    total += intPart;
    fraction += fracPart;
  });
  total += Math.floor(fraction / 3);
  fraction = fraction % 3;
  let fracStr = '';
  if (fraction === 1) fracStr = '.1';
  else if (fraction === 2) fracStr = '.2';
  return total + fracStr;
}

function App() {
  // ここに全てのuseStateやロジックを配置
  const [pitcherRecords, setPitcherRecords] = useState(() => {
    const saved = localStorage.getItem('pitcherRecords');
    return saved ? JSON.parse(saved) : [];
  });

  // 投手成績 期間フィルタ状態
  const [pitcherMonthFilter, setPitcherMonthFilter] = useState('all');
  // 投手成績 月リスト生成
  const getPitcherMonthList = (records) => {
    const months = Array.from(new Set(records.map(r => (r.date||'').slice(0,7)).filter(Boolean)));
    months.sort();
    return months;
  };
  // 投手成績 月リスト
  const pitcherMonthList = getPitcherMonthList(pitcherRecords);
  // 投手成績 フィルタ適用
  const pitcherFilteredRecords = pitcherMonthFilter === 'all' ? pitcherRecords : pitcherRecords.filter(r => (r.date||'').slice(0,7) === pitcherMonthFilter);

  // 投手成績 並べ替え状態
  const [pitcherSortKey, setPitcherSortKey] = useState('innings');
  const [pitcherSortAsc, setPitcherSortAsc] = useState(false);
  // ソートハンドラ
  const handlePitcherSort = (key) => {
    if (pitcherSortKey === key) setPitcherSortAsc(v => !v);
    else { setPitcherSortKey(key); setPitcherSortAsc(false); }
  };
  // テーブルヘッダ定義
  const pitcherStatHeaders = [
    {key:'pitcher',label:'投手名'},
    {key:'innings',label:'投球回'},
    {key:'pitches',label:'球数'},
    {key:'batters',label:'打者'},
    {key:'hits',label:'安打'},
    {key:'hr',label:'本塁打'},
    {key:'so',label:'三振'},
    {key:'bb',label:'四球'},
    {key:'hbp',label:'死球'},
    {key:'wp',label:'暴投'},
    {key:'pb',label:'捕逸'},
    {key:'bk',label:'ボーク'},
    {key:'runs',label:'失点'},
    {key:'er',label:'自責点'},
    {key:'era',label:'防御率'}
  ];
  // 投手成績集計
  const pitcherStats = calcPitcherStats(pitcherFilteredRecords);
  // ソート済みキー
  const pitcherSortedKeys = Object.keys(pitcherStats).sort((a, b) => {
    const getValue = (p, key) => {
      if (!pitcherStats[p]) return -1;
      if (key === 'pitcher') return p;
      if (key === 'innings') {
        // 0.1=1/3, 0.2=2/3, 0.3で1回繰り上げ
        const n = Number(pitcherStats[p][key] || 0);
        const intPart = Math.floor(n);
        const fracPart = Math.round((n-intPart)*10);
        return intPart + fracPart/3;
      }
      return Number(pitcherStats[p][key] || 0);
    };
    const va = getValue(a, pitcherSortKey);
    const vb = getValue(b, pitcherSortKey);
    if (va === vb) return a.localeCompare(b);
    return pitcherSortAsc ? va-vb : vb-va;
  });
  // 投手試合ごとの成績（履歴）の折りたたみ状態
  const [isPitcherRecordsOpen, setIsPitcherRecordsOpen] = useState(true);
  // 投手通算成績の折りたたみ状態
  const [isPitcherStatsOpen, setIsPitcherStatsOpen] = useState(true);
  // 成績一覧の折りたたみ状態
  const [isRecordsOpen, setIsRecordsOpen] = useState(true);
  const [editIndex, setEditIndex] = useState(null);
  const [undoRecords, setUndoRecords] = useState([]);

  const [form, setForm] = useState(initialForm);
  // 投手データ
  const [pitcherForm, setPitcherForm] = useState(initialPitcherForm);
  // pitcherRecordsはApp関数の最初で定義済み（重複削除）
  const [pitchers, setPitchers] = useState(() => {
    const saved = localStorage.getItem('pitchers');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPitcher, setNewPitcher] = useState('');

  // 投手データlocalStorage保存
  React.useEffect(() => {
    localStorage.setItem('pitcherRecords', JSON.stringify(pitcherRecords));
  }, [pitcherRecords]);
  React.useEffect(() => {
    localStorage.setItem('pitchers', JSON.stringify(pitchers));
  }, [pitchers]);

  // 投手フォーム変更
  const handlePitcherFormChange = (e) => {
    setPitcherForm({ ...pitcherForm, [e.target.name]: e.target.value });
  };
  // 投手成績追加
  const handleAddPitcherRecord = (e) => {
    e.preventDefault();
    if (!pitcherForm.pitcher) return;
    setPitcherRecords([...pitcherRecords, pitcherForm]);
    setPitcherForm(initialPitcherForm);
  };
  // 投手記録削除
  const handleDeletePitcherRecord = (idx) => {
    if (window.confirm('この投手成績を削除しますか？')) {
      setPitcherRecords(pitcherRecords.filter((_, i) => i !== idx));
    }
  };
  // 投手名追加
  const handleAddPitcher = (e) => {
    e.preventDefault();
    if (newPitcher && !pitchers.includes(newPitcher)) {
      setPitchers([...pitchers, newPitcher]);
      setNewPitcher('');
    }
  };

  // localStorageから初期値を取得
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('records');
    return saved ? JSON.parse(saved) : [];
  });
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('players');
    return saved ? JSON.parse(saved) : defaultPlayers;
  });
  const [newPlayer, setNewPlayer] = useState('');

  // records永続化
  React.useEffect(() => {
    localStorage.setItem('records', JSON.stringify(records));
  }, [records]);

  // players永続化
  React.useEffect(() => {
    localStorage.setItem('players', JSON.stringify(players));
  }, [players]);

  const exportRecordsCSV = () => {
    if (records.length === 0) return;
    // ヘッダー
    const header = [
      'player','opponent','date','pa','ab','result','hitType','rbi','battedDirection','run','sb','position','error'
    ];
    const rows = records.map(rec =>
      header.map(h => rec[h] ?? '').join(',')
    );
    const csv = [header.join(','), ...rows].join('\r\n');
    // UTF-8 BOM付き（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 投手成績CSVエクスポート
  const exportPitcherRecordsCSV = () => {
    if (pitcherRecords.length === 0) return;
    const header = [
      'pitcher','opponent','date','innings','pitches','batters','hits','hr','so','bb','hbp','wp','pb','bk','runs','er'
    ];
    const rows = pitcherRecords.map(rec =>
      header.map(h => rec[h] ?? '').join(',')
    );
    const csv = [header.join(','), ...rows].join('\r\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pitcher_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 投手成績CSVインポート
  const importPitcherRecordsCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target.result;
      text = text.replace(/\r\n/g, '\n');
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const header = lines[0].split(',');
      const newRecords = lines.slice(1).map(line => {
        const cols = line.split(',');
        const rec = {};
        header.forEach((h, i) => { rec[h] = cols[i] ?? ''; });
        return rec;
      });
      setPitcherRecords(newRecords);
    };
    reader.readAsText(file);
  };


  // 成績CSVインポート
  const importRecordsCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target.result;
      // Excel保存でダブルクォート囲みや全角カンマ対応
      text = text.replace(/\r\n/g, '\n');
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const header = lines[0].split(',');
      const newRecords = lines.slice(1).map(line => {
        const cols = line.split(',');
        const rec = {};
        header.forEach((h, i) => { rec[h] = cols[i] ?? ''; });
        return rec;
      });
      setRecords(newRecords);
    };
    // Shift_JIS優先で読んでみる
    try {
      reader.readAsText(file, 'shift_jis');
    } catch {
      reader.readAsText(file, 'utf-8');
    }
  };

  // CSVエクスポート
  const exportPlayersCSV = () => {
    // Shift_JISでエクスポート（Excel日本語環境向け）
    let sjisArray;
    if (window.TextEncoder && typeof window.TextEncoder === 'function') {
      try {
        sjisArray = new TextEncoder('shift-jis').encode(players.join('\r\n'));
      } catch {
        // TextEncoderがshift-jis非対応の場合はUTF-8+BOMでフォールバック
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const csv = players.join('\r\n');
        sjisArray = new Blob([bom, csv], { type: 'text/csv' });
      }
    } else {
      // TextEncoderがない場合はUTF-8+BOMでフォールバック
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const csv = players.join('\r\n');
      sjisArray = new Blob([bom, csv], { type: 'text/csv' });
    }
    const blob = sjisArray instanceof Blob ? sjisArray : new Blob([sjisArray], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.csv';
    a.click();
    URL.revokeObjectURL(url);
  };


  // CSVインポート
  const importPlayersCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      setPlayers(lines);
    };
    // まずShift_JISで読んでみる（Excel保存CSV対応）
    try {
      reader.readAsText(file, 'shift_jis');
    } catch {
      // 失敗した場合はUTF-8で再読込
      reader.readAsText(file, 'utf-8');
    }
  };


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 選手追加
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (newPlayer && !players.includes(newPlayer)) {
      setPlayers([...players, newPlayer]);
      setNewPlayer('');
    }
  };
  // 選手削除
  const handleRemovePlayer = (name) => {
    setPlayers(players.filter((p) => p !== name));
    // フォームで選択中の選手が消された場合は空にする
    if (form.player === name) setForm({ ...form, player: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.player || !form.result) return;
    // 打席・打数を自動計算
    const autoPa = 1;
    const autoAb = (form.result === '四球' || form.result === '死球') ? 0 : 1;
    setUndoRecords([...undoRecords, records]); // 直前の状態を履歴に保存
    if (editIndex !== null) {
      // 編集時は該当indexを上書き
      const updated = [...records];
      updated[editIndex] = { ...form, pa: autoPa, ab: autoAb };
      setRecords(updated);
      setEditIndex(null);
    } else {
      setRecords([
        ...records,
        { ...form, pa: autoPa, ab: autoAb }
      ]);
    }
    // setForm(initialForm); // 入力内容をクリアしない
  };



  // 過去入力の編集
  const handleEditRecord = (idx) => {
    setForm(records[idx]);
    setEditIndex(idx);
  };

  // ひとつ前に戻す
  const handleUndo = () => {
    if (undoRecords.length > 0) {
      setRecords(undoRecords[undoRecords.length - 1]);
      setUndoRecords(undoRecords.slice(0, -1));
    }
  };

  // 全成績削除
  const handleDeleteAllRecords = () => {
    if (window.confirm('本当に全成績を削除しますか？')) {
      setUndoRecords([...undoRecords, records]);
      setRecords([]);
    }
  };

  // 単一成績削除
  const handleDeleteRecord = (idx) => {
    if (window.confirm('この成績を削除しますか？')) {
      setUndoRecords([...undoRecords, records]);
      setRecords(records.filter((_, i) => i !== idx));
    }
  };

  // 月別フィルタ用 state
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'

  // 月別フィルタリスト作成
  const monthList = Array.from(new Set(records.map(r => r.date && r.date.length >= 7 ? r.date.slice(0,7) : null).filter(Boolean))).sort().reverse();

  // 成績一覧テーブル用フィルタstate
  const [recordPlayerFilter, setRecordPlayerFilter] = useState("");
  const [recordOpponentFilter, setRecordOpponentFilter] = useState("");
  const [recordDateFilter, setRecordDateFilter] = useState("");

  // フィルタ適用済みレコード（月別）
  const filteredRecords = monthFilter === 'all' ? records : records.filter(r => r.date && r.date.startsWith(monthFilter));

  // 成績一覧テーブル用のさらに詳細なフィルタ
  const filteredRecordsForTable = filteredRecords.filter(r =>
    (!recordPlayerFilter || r.player === recordPlayerFilter)
    && (!recordOpponentFilter || r.opponent === recordOpponentFilter)
    && (!recordDateFilter || r.date === recordDateFilter)
  );

  // フィルタ済みで集計
  const stats = calcStats(filteredRecords);

  // 選手別成績の並べ替え
  const [sortKey, setSortKey] = useState('pa'); // 初期は打席降順
  const sortedPlayers = [...players].sort((a, b) => {
    // 打率・出塁率は文字列"-"を最小扱いで数値ソート
    const getValue = (p, key) => {
      if (!stats[p]) {
        if (key === 'player') return p;
        return -1; // 数値系は最小扱い
      }
      if (key === 'avg' || key === 'obp') return stats[p][key] === '-' ? -1 : parseFloat(stats[p][key]);
      if (key === 'player') return p;
      return Number(stats[p][key] ?? 0);
    };
    if (sortKey === 'player') {
      // 名前は五十音順降順
      return b.localeCompare(a, 'ja');
    }
    return getValue(b, sortKey) - getValue(a, sortKey);
  });

  // グラフ用データ
  const barData = {
    labels: players,
    datasets: [
      {
        label: '安打',
        data: players.map((p) => stats[p]?.h ?? 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      },
      {
        label: '打数',
        data: players.map((p) => stats[p]?.ab ?? 0),
        backgroundColor: 'rgba(255, 99, 132, 0.4)'
      },
      {
        label: '四球',
        data: players.map((p) => stats[p]?.bb ?? 0),
        backgroundColor: 'rgba(255, 206, 86, 0.5)'
      },
      {
        label: '三振',
        data: players.map((p) => stats[p]?.so ?? 0),
        backgroundColor: 'rgba(153, 102, 255, 0.4)'
      },
      {
        label: '打点',
        data: players.map((p) => stats[p]?.rbi ?? 0),
        backgroundColor: 'rgba(75, 192, 192, 0.4)'
      },
      {
        label: '得点',
        data: players.map((p) => stats[p]?.run ?? 0),
        backgroundColor: 'rgba(255, 159, 64, 0.4)'
      }
    ]
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="container mt-4">
      <h2>2025シーズン個人成績</h2>
      {/* 選手リスト編集エリア */}
      <div className="mb-3">
        <label className="form-label fw-bold">選手リスト編集</label>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          
          <div className="mb-3">
            <form className="d-flex gap-2" onSubmit={handleAddPlayer}>
              <input type="text" className="form-control" style={{ maxWidth: 200 }} value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} placeholder="新規選手名" />
              <button type="submit" className="btn btn-success">追加</button>
            </form>
            <div className="mt-2 mb-2 d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={exportPlayersCSV}>選手リストCSV書き出し</button>
              <label className="btn btn-outline-secondary btn-sm mb-0">
                CSV読み込み
                <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={importPlayersCSV} />
              </label>
            </div>
            
          </div>
        </div>
      </div>

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-2">
          <select className="form-select" name="player" value={form.player} onChange={handleChange} required>
            <option value="">選手を選択</option>
            {players.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <input type="text" className="form-control" name="opponent" value={form.opponent} onChange={handleChange} placeholder="対戦相手" />
        </div>
        <div className="col-md-2">
          <input type="date" className="form-control" name="date" value={form.date} onChange={handleChange} />
        </div>
        <div className="col-md-2">
          <select className="form-select" name="result" value={form.result} onChange={handleChange} required>
            <option value="">打席結果</option>
            <option value="ヒット">ヒット</option>
            <option value="四球">四球</option>
            <option value="死球">死球</option>
            <option value="空振三振">空振三振</option>
            <option value="見逃三振">見逃三振</option>
            <option value="三振">三振</option>
            <option value="アウト">アウト</option>
            <option value="エラー出塁">エラー出塁</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" name="hitType" value={form.hitType} onChange={handleChange} disabled={form.result !== 'ヒット'}>
            <option value="">安打種類</option>
            <option value="単打">単打</option>
            <option value="内野安打">内野安打</option>
            <option value="二塁打">二塁打</option>
            <option value="三塁打">三塁打</option>
            <option value="本塁打">本塁打</option>
          </select>
        </div>
        {(form.result === 'ヒット' || form.result === 'アウト' || form.result === 'エラー出塁') && (
          <div className="col-md-2">
            <select className="form-select" name="battedDirection" value={form.battedDirection} onChange={handleChange}>
              <option value="">打球方向</option>
              <option value="1">1(投)</option>
              <option value="2">2(捕)</option>
              <option value="3">3(一)</option>
              <option value="4">4(二)</option>
              <option value="5">5(三)</option>
              <option value="6">6(遊)</option>
              <option value="7">7(左)</option>
              <option value="8">8(中)</option>
              <option value="9">9(右)</option>
            </select>
          </div>
        )}
        <div className="col-md-1">
          <input type="number" className="form-control" name="rbi" value={form.rbi} onChange={handleChange} placeholder="打点" min="0" />
        </div>
        <div className="col-md-1">
          <input type="number" className="form-control" name="run" value={form.run} onChange={handleChange} placeholder="得点" min="0" />
        </div>
        <div className="col-md-1">
          <input type="number" className="form-control" name="sb" value={form.sb} onChange={handleChange} placeholder="盗塁" min="0" />
        </div>
        <div className="col-md-1">
          <input type="text" className="form-control" name="position" value={form.position} onChange={handleChange} placeholder="守備位置" />
        </div>
        <div className="col-md-1">
          <input type="number" className="form-control" name="error" value={form.error} onChange={handleChange} placeholder="失策" min="0" />
        </div>
        <div className="col-md-2 d-grid">
          <button type="submit" className="btn btn-primary">追加</button>
        </div>
      </form>


      <div className="mb-2 d-flex gap-2">
        <button className="btn btn-warning btn-sm" onClick={handleUndo} disabled={undoRecords.length === 0}>一つ前に戻す</button>
        <button className="btn btn-danger btn-sm" onClick={handleDeleteAllRecords} disabled={records.length === 0}>全成績削除</button>
      </div>
      {/* 成績一覧 折りたたみトグル */}
<div className="d-flex align-items-center mt-4 mb-2">
  <h4 className="mb-0">成績一覧</h4>
  <button
    className="btn btn-link btn-sm ms-2"
    onClick={() => setIsRecordsOpen(open => !open)}
    aria-expanded={isRecordsOpen}
    aria-controls="recordsTable"
  >
    {isRecordsOpen ? '▲ 折りたたむ' : '▼ 開く'}
  </button>
</div>
{/* フィルタUI追加 */}
<div className="mb-2 d-flex gap-2 align-items-center">
  <label className="mb-0">選手</label>
  <select className="form-select form-select-sm" style={{width: 'auto'}} value={recordPlayerFilter} onChange={e => setRecordPlayerFilter(e.target.value)}>
    <option value="">全員</option>
    {players.map(p => <option key={p} value={p}>{p}</option>)}
  </select>
  <label className="mb-0">対戦相手</label>
  <select className="form-select form-select-sm" style={{width: 'auto'}} value={recordOpponentFilter} onChange={e => setRecordOpponentFilter(e.target.value)}>
    <option value="">全て</option>
    {[...new Set(records.map(r => r.opponent).filter(Boolean))].map(op => <option key={op} value={op}>{op}</option>)}
  </select>
  <label className="mb-0">日付</label>
  <select className="form-select form-select-sm" style={{width: 'auto'}} value={recordDateFilter} onChange={e => setRecordDateFilter(e.target.value)}>
    <option value="">全て</option>
    {[...new Set(records.map(r => r.date).filter(Boolean))].sort().map(date => <option key={date} value={date}>{date}</option>)}
  </select>
</div>

{isRecordsOpen && (
  <div className="table-responsive" id="recordsTable">
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>選手名</th>
          <th>対戦相手</th>
          <th>日付</th>
          <th>打席</th>
          <th>打数</th>
          <th>結果</th>
          <th>安打種類</th>
          <th>打点</th>
          <th>得点</th>
          <th>盗塁</th>
          <th>守備位置</th>
          <th>失策</th>
          <th>単打</th>
          <th>内野安打</th>
          <th>二塁打</th>
          <th>三塁打</th>
          <th>本塁打</th>
          <th>四球</th>
          <th>死球</th>
          <th>空振三振</th>
          <th>見逃三振</th>
          <th>三振</th>
          <th>打率</th>
          <th>出塁率</th>
        </tr>
      </thead>
      <tbody>
        {filteredRecordsForTable.map((rec, i) => (
          <tr key={i}>
            <td><Link to={`/player/${encodeURIComponent(rec.player)}`}>{rec.player}</Link></td>
            <td>{rec.opponent}</td>
            <td>{rec.date}</td>
            <td>{rec.pa}</td>
            <td>{rec.ab}</td>
            <td>{rec.result}</td>
            <td>{rec.hitType}</td>
<td>{rec.battedDirection}</td>
            <td>{rec.rbi}</td>
            <td>{rec.run}</td>
            <td>{rec.sb}</td>
            <td>{rec.position}</td>
            <td>{rec.error}</td>
            <td>{rec.hitType === '単打' ? 1 : 0}</td>
            <td>{rec.hitType === '内野安打' ? 1 : 0}</td>
            <td>{rec.hitType === '二塁打' ? 1 : 0}</td>
            <td>{rec.hitType === '三塁打' ? 1 : 0}</td>
            <td>{rec.hitType === '本塁打' ? 1 : 0}</td>
            <td>{rec.result === '四球' ? 1 : 0}</td>
            <td>{rec.result === '死球' ? 1 : 0}</td>
            <td>{rec.result === '空振三振' ? 1 : 0}</td>
            <td>{rec.result === '見逃三振' ? 1 : 0}</td>
            <td>{rec.result === '三振' ? 1 : 0}</td>
            <td>-</td>
            <td>-</td>
            <td>
              <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditRecord(i)}>編集</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRecord(i)}>削除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

<div className="d-flex align-items-center mt-4 mb-2">
  <h4 className="mb-0">選手別通算成績</h4>
  <select className="form-select form-select-sm ms-3" style={{width: 'auto'}} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
    <option value="all">全期間</option>
    {monthList.map(m => (
      <option key={m} value={m}>{m.replace('-', '年')}月</option>
    ))}
  </select>
  <span className="ms-2 small text-secondary">※月を選ぶとその月だけの成績を表示</span>
</div>
{/* チーム合計成績テーブル */}
<div className="table-responsive mb-3">
  <table className="table table-bordered table-sm">
    <thead>
      <tr>
        <th>試合数</th>
        <th>チーム合計</th>
        <th>打席</th>
        <th>打数</th>
        <th>安打</th>
        <th>単打</th>
        <th>内野安打</th>
        <th>二塁打</th>
        <th>三塁打</th>
        <th>本塁打</th>
        <th>四球</th>
        <th>死球</th>
        <th>空振三振</th>
        <th>見逃三振</th>
        <th>三振</th>
        <th>打点</th>
        <th>得点</th>
        <th>盗塁</th>
        <th>失策</th>
        <th>打率</th>
        <th>出塁率</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        {/* 試合数: opponentの種類数 */}
        <td>{Array.from(new Set(filteredRecords.map(r => r.opponent).filter(Boolean))).length}</td>
        <td>合計</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.pa)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.ab)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.h)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.single)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.infieldHit)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.double)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.triple)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.hr)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.bb)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.hbp)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.swingSo)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.lookingSo)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.so)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.rbi)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.run)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.sb)||0), 0)}</td>
        <td>{Object.values(stats).reduce((sum, s) => sum + (Number(s.error)||0), 0)}</td>
        {/* チーム打率・出塁率は全打数/全安打などで計算 */}
        <td>
  {(() => {
    const ab = Object.values(stats).reduce((s, v) => s + Number(v.ab || 0), 0);
    const h = Object.values(stats).reduce((s, v) => s + Number(v.h || 0), 0);
    return ab > 0 ? (h / ab).toFixed(3) : '-';
  })()}
</td>
        <td>
  {(() => {
    const ab = Object.values(stats).reduce((s, v) => s + Number(v.ab || 0), 0);
    const bb = Object.values(stats).reduce((s, v) => s + Number(v.bb || 0), 0);
    const hbp = Object.values(stats).reduce((s, v) => s + Number(v.hbp || 0), 0);
    const h = Object.values(stats).reduce((s, v) => s + Number(v.h || 0), 0);
    return (ab + bb + hbp) > 0 ? ((h + bb + hbp) / (ab + bb + hbp)).toFixed(3) : '-';
  })()}
</td>
      </tr>
    </tbody>
  </table>
</div>

<div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('player')}>選手名</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('pa')}>打席</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('ab')}>打数</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('h')}>安打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('single')}>単打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('infieldHit')}>内野安打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('double')}>二塁打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('triple')}>三塁打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('hr')}>本塁打</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('bb')}>四球</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('hbp')}>死球</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('swingSo')}>空振三振</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('lookingSo')}>見逃三振</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('so')}>三振</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('rbi')}>打点</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('run')}>得点</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('sb')}>盗塁</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('error')}>失策</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('avg')}>打率</th>
              <th style={{cursor:'pointer'}} onClick={() => setSortKey('obp')}>出塁率</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((p) => (
              <tr key={p}>
                <td>{p}</td>
                <td>{stats[p]?.pa ?? 0}</td>
                <td>{stats[p]?.ab ?? 0}</td>
                <td>{stats[p]?.h ?? 0}</td>
                <td>{stats[p]?.single ?? 0}</td>
                <td>{stats[p]?.infieldHit ?? 0}</td>
                <td>{stats[p]?.double ?? 0}</td>
                <td>{stats[p]?.triple ?? 0}</td>
                <td>{stats[p]?.hr ?? 0}</td>
                <td>{stats[p]?.bb ?? 0}</td>
                <td>{stats[p]?.hbp ?? 0}</td>
                <td>{stats[p]?.swingSo ?? 0}</td>
                <td>{stats[p]?.lookingSo ?? 0}</td>
                <td>{stats[p]?.so ?? 0}</td>
                <td>{stats[p]?.rbi ?? 0}</td>
                <td>{stats[p]?.run ?? 0}</td>
                <td>{stats[p]?.sb ?? 0}</td>
                <td>{stats[p]?.error ?? 0}</td>
                <td>{stats[p]?.avg ?? '-'}</td>
                <td>{stats[p]?.obp ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-2 d-flex gap-2">
        <button className="btn btn-outline-success btn-sm" onClick={exportRecordsCSV} disabled={records.length === 0}>成績CSV書き出し</button>
        <label className="btn btn-outline-primary btn-sm mb-0">
          成績CSV読み込み
          <input type="file" accept=".csv" style={{display:'none'}} onChange={importRecordsCSV} />
        </label>
      </div>

      <h4>選手別成績グラフ</h4>
      <div style={{ maxWidth: 900 }}>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: '選手別成績' }
            }
          }}
        />
      </div>

      {/* 投手成績入力フォーム */}
      <h4 className="mt-4">投手成績入力
        <button className="btn btn-outline-secondary btn-sm ms-2" type="button" onClick={exportPitcherRecordsCSV}>CSV書き出し</button>
        <label className="btn btn-outline-secondary btn-sm ms-2 mb-0">
          CSV読み込み<input type="file" accept=".csv" style={{ display: 'none' }} onChange={importPitcherRecordsCSV} />
        </label>
      </h4>
      <form className="row g-2 align-items-end mb-3" onSubmit={handleAddPitcherRecord}>
        <div className="col-auto">
          <select className="form-select" name="pitcher" value={pitcherForm.pitcher} onChange={handlePitcherFormChange} required>
            <option value="">投手名</option>
            {players.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="col-auto"><input className="form-control" name="opponent" type="text" placeholder="対戦相手" value={pitcherForm.opponent} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="date" type="date" placeholder="日付" value={pitcherForm.date} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="innings" type="number" min="0" step="0.1" placeholder="投球回" value={pitcherForm.innings} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="pitches" type="number" min="0" placeholder="球数" value={pitcherForm.pitches} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="batters" type="number" min="0" placeholder="打者" value={pitcherForm.batters} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="hits" type="number" min="0" placeholder="安打" value={pitcherForm.hits} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="hr" type="number" min="0" placeholder="本塁打" value={pitcherForm.hr} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="so" type="number" min="0" placeholder="三振" value={pitcherForm.so} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="bb" type="number" min="0" placeholder="四球" value={pitcherForm.bb} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="hbp" type="number" min="0" placeholder="死球" value={pitcherForm.hbp} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="wp" type="number" min="0" placeholder="暴投" value={pitcherForm.wp} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="pb" type="number" min="0" placeholder="捕逸" value={pitcherForm.pb} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="bk" type="number" min="0" placeholder="ボーク" value={pitcherForm.bk} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="runs" type="number" min="0" placeholder="失点" value={pitcherForm.runs} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><input className="form-control" name="er" type="number" min="0" placeholder="自責点" value={pitcherForm.er} onChange={handlePitcherFormChange} required /></div>
        <div className="col-auto"><button className="btn btn-primary" type="submit">追加</button></div>
      </form>
      {/* 投手名追加フォーム */}
      <form className="row g-2 align-items-end mb-3" onSubmit={handleAddPitcher}>
        <div className="col-auto"><input className="form-control" type="text" placeholder="新しい投手名" value={newPitcher} onChange={e => setNewPitcher(e.target.value)} /></div>
        <div className="col-auto"><button className="btn btn-outline-primary" type="submit">投手追加</button></div>
      </form>
      {/* 投手成績 折りたたみ＋期間フィルタ＋ソート＋チーム合計 */}
      <div className="d-flex align-items-center mt-4 mb-2">
        <h4 className="mb-0">投手別通算成績</h4>
        <select className="form-select form-select-sm ms-3" style={{width: 'auto'}} value={pitcherMonthFilter} onChange={e => setPitcherMonthFilter(e.target.value)}>
          <option value="all">全期間</option>
          {pitcherMonthList.map(m => (
            <option key={m} value={m}>{m.replace('-', '年')}月</option>
          ))}
        </select>
        <span className="ms-2 small text-secondary">※月を選ぶとその月だけの成績を表示</span>
        <button
          className="btn btn-link btn-sm ms-2"
          onClick={() => setIsPitcherStatsOpen(open => !open)}
          aria-expanded={isPitcherStatsOpen}
          aria-controls="pitcherStatsTable"
        >
          {isPitcherStatsOpen ? '▲ 折りたたむ' : '▼ 開く'}
        </button>
      </div>
      {/* チーム合計テーブル */}
      {isPitcherStatsOpen && (
        <div className="table-responsive mb-2">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>試合数</th>
                <th>チーム合計</th>
                <th>投球回</th>
                <th>球数</th>
                <th>打者</th>
                <th>安打</th>
                <th>本塁打</th>
                <th>三振</th>
                <th>四球</th>
                <th>死球</th>
                <th>暴投</th>
                <th>捕逸</th>
                <th>ボーク</th>
                <th>失点</th>
                <th>自責点</th>
                <th>防御率</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{background:'#f9f9f9',fontWeight:'bold'}}>
                <td>{pitcherFilteredRecords.length === 0 ? 0 : Array.from(new Set(pitcherFilteredRecords.map(r => r.date).filter(Boolean))).length}</td>
                <td>合計</td>
                <td>{formatInningsSum(Object.values(calcPitcherStats(pitcherFilteredRecords)).map(b=>b.innings))}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.pitches||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.batters||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.hits||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.hr||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.so||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.bb||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.hbp||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.wp||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.pb||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.bk||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.runs||0),0)}</td>
                <td>{Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.er||0),0)}</td>
                {/* チーム合計防御率計算 */}
                <td>{(() => {
                  const totalInn = Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.innings||0),0);
                  const intPart = Math.floor(totalInn);
                  const fracPart = Math.round((totalInn-intPart)*10);
                  const ip = intPart + fracPart/3;
                  const totalEr = Object.values(calcPitcherStats(pitcherFilteredRecords)).reduce((a,b)=>a+Number(b.er||0),0);
                  const era = ip > 0 ? (totalEr*9/ip).toFixed(2) : '-';
                  return era;
                })()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {/* 投手別成績テーブル（ソート可） */}
      {isPitcherStatsOpen && (
        <div className="table-responsive mb-3">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                {pitcherStatHeaders.map(h => (
                  <th key={h.key} onClick={() => handlePitcherSort(h.key)} style={{cursor:'pointer'}}>
                    {h.label}{pitcherSortKey===h.key?(pitcherSortAsc?'▲':'▼'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitcherSortedKeys.map(p => {
                // 防御率計算
                const inn = Number(pitcherStats[p].innings || 0);
                const er = Number(pitcherStats[p].er || 0);
                const era = inn > 0 ? ((er * 9) / inn).toFixed(2) : '-';
                return (
                  <tr key={p}>
                    <td>{p}</td>
                    <td>{formatInningsSum([pitcherStats[p].innings])}</td>
                    <td>{pitcherStats[p].pitches}</td>
                    <td>{pitcherStats[p].batters}</td>
                    <td>{pitcherStats[p].hits}</td>
                    <td>{pitcherStats[p].hr}</td>
                    <td>{pitcherStats[p].so}</td>
                    <td>{pitcherStats[p].bb}</td>
                    <td>{pitcherStats[p].hbp}</td>
                    <td>{pitcherStats[p].wp}</td>
                    <td>{pitcherStats[p].pb}</td>
                    <td>{pitcherStats[p].bk}</td>
                    <td>{pitcherStats[p].runs}</td>
                    <td>{pitcherStats[p].er}</td>
                    <td>{era}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 投手成績入力履歴 折りたたみ */}
      <div className="d-flex align-items-center mt-4 mb-2">
        <h5 className="mb-0">投手試合ごとの成績</h5>
        <button
          className="btn btn-link btn-sm ms-2"
          onClick={() => setIsPitcherRecordsOpen(open => !open)}
          aria-expanded={isPitcherRecordsOpen}
          aria-controls="pitcherRecordsTable"
        >
          {isPitcherRecordsOpen ? '▲ 折りたたむ' : '▼ 開く'}
        </button>
      </div>
      {isPitcherRecordsOpen && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th>投手名</th><th>対戦相手</th><th>日付</th><th>投球回</th><th>球数</th><th>打者</th><th>安打</th><th>本塁打</th><th>三振</th><th>四球</th><th>死球</th><th>暴投</th><th>捕逸</th><th>ボーク</th><th>失点</th><th>自責点</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pitcherRecords.map((rec, i) => (
                <tr key={i}>
                  <td>{rec.pitcher}</td>
                  <td>{rec.opponent}</td>
                  <td>{rec.date}</td>
                  <td>{rec.innings}</td>
                  <td>{rec.pitches}</td>
                  <td>{rec.batters}</td>
                  <td>{rec.hits}</td>
                  <td>{rec.hr}</td>
                  <td>{rec.so}</td>
                  <td>{rec.bb}</td>
                  <td>{rec.hbp}</td>
                  <td>{rec.wp}</td>
                  <td>{rec.pb}</td>
                  <td>{rec.bk}</td>
                  <td>{rec.runs}</td>
                  <td>{rec.er}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDeletePitcherRecord(i)}>削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
