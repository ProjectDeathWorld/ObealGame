// ...keep imports unchanged
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { riddles } from '../data/riddles';

let db: SQLite.SQLiteDatabase | null = null;

type Level = 'easy' | 'normal' | 'hard';

const levelConfig = {
  easy: { count: 15, points: 1 },
  normal: { count: 10, points: 2 },
  hard: { count: 5, points: 3 },
};

type AnswerRecord = {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
};

export const setupDatabase = async () => {
  db = await SQLite.openDatabaseAsync('answers.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      correctAnswer TEXT,
      userAnswer TEXT,
      isCorrect INTEGER
    );
  `);
};

async function saveAnswersToDB(answers: AnswerRecord[]) {
  if (!db) return;
  await db.execAsync('DELETE FROM answers;');
  for (const a of answers) {
    await db.runAsync(
      'INSERT INTO answers (question, correctAnswer, userAnswer, isCorrect) VALUES (?, ?, ?, ?);',
      [a.question, a.correctAnswer, a.userAnswer, a.isCorrect ? 1 : 0]
    );
  }
}

async function fetchAnswersFromDB(): Promise<AnswerRecord[]> {
  if (!db) return [];
  const results = await db.getAllAsync('SELECT question, correctAnswer, userAnswer, isCorrect FROM answers;');
  return results.map((row) => {
    const typedRow = row as {
      question: string;
      correctAnswer: string;
      userAnswer: string;
      isCorrect: number;
    };
    return {
      question: typedRow.question,
      correctAnswer: typedRow.correctAnswer,
      userAnswer: typedRow.userAnswer,
      isCorrect: !!typedRow.isCorrect,
    };
  });
}


export default function LevelSelector() {
  const [level, setLevel] = useState<Level | null>(null);

  if (!level) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Choose Difficulty</Text>
        {['easy', 'normal', 'hard'].map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={styles.levelButton}
            onPress={() => setLevel(lvl as Level)}
          >
            <Text style={styles.levelButtonText}>{lvl.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return <Game level={level} goHome={() => setLevel(null)} />;
}

function Game({ level, goHome }: { level: Level; goHome: () => void }) {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [dbAnswers, setDbAnswers] = useState<AnswerRecord[]>([]);
  const [saved, setSaved] = useState(false);

  const start = level === 'normal' ? 15 : level === 'hard' ? 25 : 0;
  const questions = riddles.slice(start, start + levelConfig[level].count);

  useEffect(() => {
    setupDatabase();
  }, []);

  useEffect(() => {
    if (finished && answers.length > 0 && !saved) {
      saveAnswersToDB(answers).then(() => {
        fetchAnswersFromDB().then(setDbAnswers);
        setSaved(true);
      });
    }
  }, [finished, answers, saved]);

  const handleSubmit = () => {
    const userAnswer = input.trim();
    const correctAnswer = questions[current].answer;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      setScore(score + levelConfig[level].points);
    }

    setAnswers([
      ...answers,
      {
        question: questions[current].question,
        correctAnswer,
        userAnswer,
        isCorrect,
      },
    ]);

    setInput('');
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎉 Game Over!</Text>
        <Text style={styles.score}>Your score: {score}</Text>
        <Text style={styles.subtitle}>Review your answers</Text>
        {(dbAnswers.length > 0 ? dbAnswers : answers).map((a, i) => (
          <View
            key={i}
            style={[styles.answerBox, a.isCorrect ? styles.correct : styles.incorrect]}
          >
            <Text style={styles.questionText}>{i + 1}. {a.question}</Text>
            <Text>Your answer: <Text style={styles.bold}>{a.userAnswer || '—'}</Text></Text>
            <Text>Correct answer: <Text style={styles.bold}>{a.correctAnswer}</Text></Text>
            <Text style={{ color: a.isCorrect ? 'green' : 'red', fontWeight: 'bold' }}>
              {a.isCorrect ? '✔ Correct' : '✘ Wrong'}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={styles.playButton} onPress={() => {
          setCurrent(0);
          setScore(0);
          setFinished(false);
          setAnswers([]);
          setDbAnswers([]);
          setSaved(false);
        }}>
          <Text style={styles.playButtonText}>🔄 Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={goHome}>
          <Text style={styles.playButtonText}>🏠 Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.level}>Level: {level.toUpperCase()}</Text>
          <Text style={styles.progress}>Question {current + 1} of {questions.length}</Text>
          <Text style={styles.riddle}>{questions[current].question}</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
          <Text style={styles.score}>Score: {score}</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9FF',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#4B2991',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#6C63FF',
    textAlign: 'center',
  },
  level: { fontSize: 20, marginBottom: 8, color: '#333' },
  progress: { fontSize: 16, marginBottom: 10, color: '#666' },
  riddle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#222',
  },
  input: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  score: { fontSize: 18, marginTop: 10, color: '#4B2991' },
  submitButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerBox: {
    width: '100%',
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 6,
  },
  correct: { borderLeftColor: 'green' },
  incorrect: { borderLeftColor: 'red' },
  questionText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bold: { fontWeight: 'bold' },
  levelButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  levelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#FF6F61',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
