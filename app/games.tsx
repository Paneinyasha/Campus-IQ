import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ===================== TIC TAC TOE =====================
function TicTacToe({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  function calculateWinner(b: string[]) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return null;
  }

  const handlePress = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    const w = calculateWinner(newBoard);
    if (w) setScores(s => ({ ...s, [w]: s[w as 'X'|'O'] + 1 }));
    setXIsNext(!xIsNext);
  };

  const reset = () => { setBoard(Array(9).fill('')); setXIsNext(true); };

  return (
    <View style={g.container}>
      <View style={g.scoreRow}>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Player X</Text><Text style={g.scoreNum}>{scores.X}</Text></View>
        <Text style={g.vs}>VS</Text>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Player O</Text><Text style={g.scoreNum}>{scores.O}</Text></View>
      </View>
      <Text style={g.status}>
        {winner ? `🏆 Player ${winner} Wins!` : isDraw ? "It's a Draw!" : `Player ${xIsNext ? 'X' : 'O'}'s Turn`}
      </Text>
      <View style={g.board}>
        {board.map((cell, i) => (
          <TouchableOpacity key={i} style={[g.cell, cell === 'X' && g.cellX, cell === 'O' && g.cellO]} onPress={() => handlePress(i)}>
            <Text style={[g.cellText, cell === 'X' && { color: '#FFD700' }, cell === 'O' && { color: '#1D9E75' }]}>{cell}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={g.btn} onPress={reset}><Text style={g.btnText}>New Game</Text></TouchableOpacity>
      <TouchableOpacity style={g.backBtn} onPress={onBack}><Text style={g.backBtnText}>← Back to Games</Text></TouchableOpacity>
    </View>
  );
}

// ===================== MEMORY MATCH =====================
const EMOJIS = ['🎓','📚','🏫','🖥','📱','🎯','🔬','🎨'];
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function MemoryMatch({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState(() => shuffle([...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const matched = cards.filter(c => c.matched).length / 2;

  const handleFlip = (id: number) => {
    if (locked || cards[id].flipped || cards[id].matched) return;
    const newCards = cards.map((c, i) => i === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newSelected;
      if (newCards[a].emoji === newCards[b].emoji) {
        setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
        setSelected([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    } else {
      setSelected(newSelected);
    }
  };

  const reset = () => {
    setCards(shuffle([...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))));
    setSelected([]); setMoves(0); setLocked(false);
  };

  return (
    <View style={g.container}>
      <View style={g.scoreRow}>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Matched</Text><Text style={g.scoreNum}>{matched}/8</Text></View>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Moves</Text><Text style={g.scoreNum}>{moves}</Text></View>
      </View>
      {matched === 8 && <Text style={g.status}>🎉 You Won in {moves} moves!</Text>}
      <View style={g.memGrid}>
        {cards.map((card, i) => (
          <TouchableOpacity key={card.id} style={[g.memCard, (card.flipped || card.matched) && g.memCardFlipped]} onPress={() => handleFlip(i)}>
            <Text style={g.memEmoji}>{card.flipped || card.matched ? card.emoji : '?'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={g.btn} onPress={reset}><Text style={g.btnText}>New Game</Text></TouchableOpacity>
      <TouchableOpacity style={g.backBtn} onPress={onBack}><Text style={g.backBtnText}>← Back to Games</Text></TouchableOpacity>
    </View>
  );
}

// ===================== SNAKE =====================
function NumberPuzzle({ onBack }: { onBack: () => void }) {
  const SIZE = 4;
  const goal = [...Array(SIZE * SIZE - 1).keys()].map(i => i + 1).concat([0]);

  const generatePuzzle = () => {
    let tiles = [...goal];
    for (let i = 0; i < 200; i++) {
      const blank = tiles.indexOf(0);
      const moves: number[] = [];
      if (blank % SIZE > 0) moves.push(blank - 1);
      if (blank % SIZE < SIZE - 1) moves.push(blank + 1);
      if (blank >= SIZE) moves.push(blank - SIZE);
      if (blank < SIZE * (SIZE - 1)) moves.push(blank + SIZE);
      const move = moves[Math.floor(Math.random() * moves.length)];
      [tiles[blank], tiles[move]] = [tiles[move], tiles[blank]];
    }
    return tiles;
  };

  const [tiles, setTiles] = useState(generatePuzzle);
  const [moves, setMoves] = useState(0);
  const won = tiles.join(',') === goal.join(',');

  const handleTap = (i: number) => {
    const blank = tiles.indexOf(0);
    const validMoves = [blank - 1, blank + 1, blank - SIZE, blank + SIZE];
    const sameRow = Math.floor(i / SIZE) === Math.floor(blank / SIZE);
    if ((i === blank - 1 || i === blank + 1) && !sameRow) return;
    if (!validMoves.includes(i)) return;
    const newTiles = [...tiles];
    [newTiles[blank], newTiles[i]] = [newTiles[i], newTiles[blank]];
    setTiles(newTiles);
    setMoves(m => m + 1);
  };

  const reset = () => { setTiles(generatePuzzle()); setMoves(0); };

  return (
    <View style={g.container}>
      <View style={g.scoreRow}>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Moves</Text><Text style={g.scoreNum}>{moves}</Text></View>
        {won && <View style={g.scoreBox}><Text style={[g.scoreNum, { color: '#1D9E75' }]}>🏆 Solved!</Text></View>}
      </View>
      <Text style={g.status}>Slide tiles to arrange 1-15</Text>
      <View style={g.puzzleGrid}>
        {tiles.map((tile, i) => (
          <TouchableOpacity key={i} style={[g.puzzleTile, tile === 0 && g.puzzleTileBlank]} onPress={() => handleTap(i)}>
            {tile !== 0 && <Text style={g.puzzleTileText}>{tile}</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={g.btn} onPress={reset}><Text style={g.btnText}>Shuffle</Text></TouchableOpacity>
      <TouchableOpacity style={g.backBtn} onPress={onBack}><Text style={g.backBtnText}>← Back to Games</Text></TouchableOpacity>
    </View>
  );
}

// ===================== WORD GUESS =====================
const WORDS = ['CAMPUS','LIBRARY','LECTURE','STUDENT','DEGREE','FACULTY','THESIS','HOSTEL','SCIENCE','SPORTS'];

function WordGuess({ onBack }: { onBack: () => void }) {
  const [word] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [newWord, setNewWord] = useState(false);
  const maxWrong = 6;
  const wrong = guessed.filter(l => !word.includes(l)).length;
  const won = word.split('').every(l => guessed.includes(l));
  const lost = wrong >= maxWrong;

  const KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter) || won || lost) return;
    setGuessed(g => [...g, letter]);
  };

  const reset = () => { setGuessed([]); setNewWord(w => !w); };

  return (
    <View style={g.container}>
      <View style={g.scoreRow}>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Wrong</Text><Text style={[g.scoreNum, { color: '#D85A30' }]}>{wrong}/{maxWrong}</Text></View>
        <View style={g.scoreBox}><Text style={g.scoreLabel}>Letters Left</Text><Text style={g.scoreNum}>{word.split('').filter(l => !guessed.includes(l)).length}</Text></View>
      </View>

      {/* Hangman Display */}
      <View style={g.hangmanBox}>
        <Text style={g.hangmanFigure}>
          {wrong >= 1 ? '😵' : '🙂'}
        </Text>
        <Text style={g.wrongLetters}>{guessed.filter(l => !word.includes(l)).join('  ')}</Text>
      </View>

      <View style={g.wordRow}>
        {word.split('').map((l, i) => (
          <View key={i} style={g.letterBox}>
            <Text style={g.letterText}>{guessed.includes(l) ? l : '_'}</Text>
          </View>
        ))}
      </View>

      {(won || lost) && (
        <Text style={[g.status, { color: won ? '#1D9E75' : '#D85A30' }]}>
          {won ? '🎉 You Won!' : `💀 Lost! Word: ${word}`}
        </Text>
      )}

      <View style={g.keyboard}>
        {KEYBOARD.map(l => (
          <TouchableOpacity
            key={l}
            style={[g.key, guessed.includes(l) && (word.includes(l) ? g.keyCorrect : g.keyWrong)]}
            onPress={() => handleGuess(l)}
          >
            <Text style={g.keyText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={g.btn} onPress={reset}><Text style={g.btnText}>New Word</Text></TouchableOpacity>
      <TouchableOpacity style={g.backBtn} onPress={onBack}><Text style={g.backBtnText}>← Back to Games</Text></TouchableOpacity>
    </View>
  );
}

// ===================== MAIN GAMES MENU =====================
const GAME_LIST = [
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: 'grid-outline', desc: '2 Players • Classic Strategy', color: '#534AB7' },
  { id: 'memory', name: 'Memory Match', icon: 'albums-outline', desc: '1 Player • Find the Pairs', color: '#1D9E75' },
  { id: 'puzzle', name: '15 Puzzle', icon: 'apps-outline', desc: '1 Player • Slide Tiles', color: '#D85A30' },
  { id: 'word', name: 'Word Guess', icon: 'text-outline', desc: '1 Player • Guess the Word', color: '#EF9F27' },
];

export default function Games() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'tictactoe') return <TicTacToe onBack={() => setActiveGame(null)} />;
  if (activeGame === 'memory') return <MemoryMatch onBack={() => setActiveGame(null)} />;
  if (activeGame === 'puzzle') return <NumberPuzzle onBack={() => setActiveGame(null)} />;
  if (activeGame === 'word') return <WordGuess onBack={() => setActiveGame(null)} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Games</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.subtitle}>Play offline anytime • No internet needed</Text>
        {GAME_LIST.map(game => (
          <TouchableOpacity key={game.id} style={styles.gameCard} onPress={() => setActiveGame(game.id)}>
            <View style={[styles.gameIcon, { backgroundColor: game.color + '22', borderColor: game.color }]}>
              <Ionicons name={game.icon as any} size={36} color={game.color} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDesc}>{game.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#a0c4ff" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  list: { padding: 20, gap: 14 },
  subtitle: { fontSize: 13, color: '#a0c4ff', textAlign: 'center', marginBottom: 8 },
  gameCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  gameIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  gameDesc: { fontSize: 13, color: '#a0c4ff' },
});

const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  scoreBox: { alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, minWidth: 90 },
  scoreLabel: { fontSize: 12, color: '#a0c4ff' },
  scoreNum: { fontSize: 24, fontWeight: 'bold', color: '#FFD700' },
  vs: { fontSize: 16, fontWeight: 'bold', color: '#a0c4ff', alignSelf: 'center' },
  status: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', textAlign: 'center', marginBottom: 16 },
  board: { flexDirection: 'row', flexWrap: 'wrap', width: 270, alignSelf: 'center', gap: 6, marginBottom: 20 },
  cell: { width: 82, height: 82, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cellX: { borderColor: '#FFD700', backgroundColor: '#2a2000' },
  cellO: { borderColor: '#1D9E75', backgroundColor: '#0a3d2e' },
  cellText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  btn: { backgroundColor: '#534AB7', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backBtn: { alignItems: 'center', padding: 8 },
  backBtnText: { color: '#a0c4ff', fontSize: 14 },
  memGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 300, alignSelf: 'center', gap: 8, marginBottom: 20 },
  memCard: { width: 64, height: 64, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memCardFlipped: { backgroundColor: '#1a1650', borderColor: '#FFD700' },
  memEmoji: { fontSize: 28 },
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 280, alignSelf: 'center', gap: 4, marginBottom: 20 },
  puzzleTile: { width: 64, height: 64, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  puzzleTileBlank: { backgroundColor: '#001f4d', borderColor: '#001f4d' },
  puzzleTileText: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  hangmanBox: { alignItems: 'center', marginBottom: 12 },
  hangmanFigure: { fontSize: 48, marginBottom: 4 },
  wrongLetters: { fontSize: 14, color: '#D85A30', letterSpacing: 4 },
  wordRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' },
  letterBox: { width: 32, height: 40, borderBottomWidth: 2, borderBottomColor: '#FFD700', alignItems: 'center', justifyContent: 'flex-end' },
  letterText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 16 },
  key: { width: 34, height: 34, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  keyCorrect: { backgroundColor: '#0a3d2e', borderColor: '#1D9E75' },
  keyWrong: { backgroundColor: '#3d0a0a', borderColor: '#D85A30' },
  keyText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
});
