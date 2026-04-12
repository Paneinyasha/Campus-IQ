import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function QuizResults() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = () => {
    try {
      const result = db.getAllSync(`SELECT * FROM lecturer_quizzes ORDER BY created_at DESC`);
      setQuizzes(result);
    } catch (e) {}
  };

  const loadResults = (quiz: any) => {
    try {
      const result = db.getAllSync(
        `SELECT quiz_results.*, students.name, students.surname, students.program
         FROM quiz_results
         LEFT JOIN students ON quiz_results.student_reg = students.reg_number
         WHERE quiz_results.quiz_id = ?
         ORDER BY quiz_results.score DESC`,
        [quiz.id]
      );
      setResults(result);
      setSelectedQuiz(quiz);
    } catch (e) {}
  };

  const getScoreColor = (score: number, total: number) => {
    const percent = (score / total) * 100;
    if (percent >= 75) return '#1D9E75';
    if (percent >= 50) return '#FFD700';
    return '#D85A30';
  };

  const getGrade = (score: number, total: number) => {
    const percent = (score / total) * 100;
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    return 'F';
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (selectedQuiz) {
              setSelectedQuiz(null);
              setResults([]);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedQuiz ? 'Results' : 'Quiz Results'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {!selectedQuiz ? (
        <>
          <Text style={styles.subtitle}>Select a quiz to view results</Text>

          {quizzes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
              <Text style={styles.emptyText}>Create a quiz first to see results</Text>
            </View>
          ) : (
            quizzes.map((quiz: any) => {
              const resultCount = db.getFirstSync(
                `SELECT COUNT(*) as count FROM quiz_results WHERE quiz_id = ?`,
                [quiz.id]
              ) as any;
              const avgScore = db.getFirstSync(
                `SELECT AVG(CAST(score AS FLOAT) / total * 100) as avg FROM quiz_results WHERE quiz_id = ?`,
                [quiz.id]
              ) as any;

              return (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  onPress={() => loadResults(quiz)}
                >
                  <View style={styles.quizLeft}>
                    <View style={styles.quizIcon}>
                      <Ionicons name="clipboard" size={28} color="#534AB7" />
                    </View>
                    <View>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      <Text style={styles.quizModule}>{quiz.module}</Text>
                      <View style={styles.quizMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={14} color="#a0c4ff" />
                          <Text style={styles.metaText}>{resultCount?.count || 0} attempts</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="stats-chart-outline" size={14} color="#a0c4ff" />
                          <Text style={styles.metaText}>
                            Avg: {avgScore?.avg ? Math.round(avgScore.avg) : 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : (
        <>
          <View style={styles.quizInfoBox}>
            <Text style={styles.quizInfoTitle}>{selectedQuiz.title}</Text>
            <Text style={styles.quizInfoModule}>{selectedQuiz.module}</Text>
            <View style={styles.quizInfoStats}>
              <View style={styles.infoStat}>
                <Text style={styles.infoStatNum}>{results.length}</Text>
                <Text style={styles.infoStatLabel}>Attempts</Text>
              </View>
              <View style={styles.infoStat}>
                <Text style={styles.infoStatNum}>
                  {results.length > 0
                    ? Math.round(results.reduce((sum: number, r: any) => sum + (r.score / r.total * 100), 0) / results.length)
                    : 0}%
                </Text>
                <Text style={styles.infoStatLabel}>Avg Score</Text>
              </View>
              <View style={styles.infoStat}>
                <Text style={[styles.infoStatNum, { color: '#1D9E75' }]}>
                  {results.filter((r: any) => (r.score / r.total * 100) >= 50).length}
                </Text>
                <Text style={styles.infoStatLabel}>Passed</Text>
              </View>
              <View style={styles.infoStat}>
                <Text style={[styles.infoStatNum, { color: '#D85A30' }]}>
                  {results.filter((r: any) => (r.score / r.total * 100) < 50).length}
                </Text>
                <Text style={styles.infoStatLabel}>Failed</Text>
              </View>
            </View>
          </View>

          {results.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={50} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Results Yet</Text>
              <Text style={styles.emptyText}>No students have attempted this quiz</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Student Results</Text>
              {results.map((result: any, index: number) => {
                const percent = Math.round((result.score / result.total) * 100);
                const grade = getGrade(result.score, result.total);
                const color = getScoreColor(result.score, result.total);

                return (
                  <View key={result.id} style={styles.resultCard}>
                    <View style={styles.resultRank}>
                      <Text style={styles.rankNum}>#{index + 1}</Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>
                        {result.name ? `${result.name} ${result.surname}` : result.student_reg}
                      </Text>
                      <Text style={styles.resultReg}>{result.student_reg}</Text>
                      {result.program && (
                        <Text style={styles.resultProgram}>{result.program}</Text>
                      )}
                      <Text style={styles.resultDate}>
                        {new Date(result.completed_at).toDateString()}
                      </Text>
                    </View>
                    <View style={styles.resultScore}>
                      <Text style={[styles.scoreNum, { color }]}>
                        {result.score}/{result.total}
                      </Text>
                      <Text style={[styles.scorePercent, { color }]}>{percent}%</Text>
                      <View style={[styles.gradeBadge, { backgroundColor: color + '22', borderColor: color }]}>
                        <Text style={[styles.gradeText, { color }]}>{grade}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0c4ff',
    marginBottom: 20,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
  },
  quizCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizLeft: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
  },
  quizIcon: {
    backgroundColor: '#1a1650',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quizModule: {
    fontSize: 12,
    color: '#a0c4ff',
    marginBottom: 6,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#a0c4ff',
    fontSize: 12,
  },
  quizInfoBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  quizInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quizInfoModule: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 16,
  },
  quizInfoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  infoStatLabel: {
    fontSize: 11,
    color: '#a0c4ff',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultRank: {
    width: 32,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  resultReg: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 2,
  },
  resultProgram: {
    fontSize: 12,
    color: '#a0c4ff',
    marginBottom: 2,
  },
  resultDate: {
    fontSize: 11,
    color: '#7a9cc4',
  },
  resultScore: {
    alignItems: 'center',
    gap: 4,
  },
  scoreNum: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scorePercent: {
    fontSize: 13,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});