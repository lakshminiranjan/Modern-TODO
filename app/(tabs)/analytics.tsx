import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart2, ChartPie as PieChart, TrendingUp, Clock, Calendar, FileText, ChevronDown } from 'lucide-react-native';
import { getTaskStats } from '@/lib/tasks';
import { subscribeToTasks } from '@/lib/tasks';
import { useTheme } from '@/contexts/ThemeContext';
import COLORS from '@/constants/colors';

export default function AnalyticsScreen() {
  const { colors, isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
    highPriorityTasks: 0,
    tasksByStatus: { completed: 0, pending: 0 },
    tasksByPriority: { high: 0, medium: 0, low: 0 }
  });

  useEffect(() => {
    loadStats();
    const subscription = subscribeToTasks(() => {
      loadStats();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadStats = async () => {
    try {
      const data = await getTaskStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <TouchableOpacity style={[styles.periodSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.periodText, { color: colors.textSecondary }]}>Last 30 Days</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Total Tasks</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.success}20` }]}>
              <FileText size={20} color={colors.success} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{stats.completed}</Text>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Completed</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.error}20` }]}>
              <Clock size={20} color={colors.error} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{stats.pending}</Text>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>Completion Rate</Text>
            <TrendingUp size={20} color={colors.success} />
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
            <View style={styles.scoreCircleContainer}>
              <View style={[styles.scoreCircle, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
                <Text style={[styles.scoreNumber, { color: colors.primary }]}>{Math.round(stats.completionRate)}%</Text>
              </View>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={[styles.scoreDetailText, { color: colors.textSecondary }]}>
                {stats.completed} out of {stats.total} tasks completed
              </Text>
            </View>
          </View>
        </View>

        {/* Task Completion Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Task Completion Rate</Text>
            <BarChart2 size={20} color={colors.primary} />
          </View>
          
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            {/* Placeholder for actual chart */}
            <View style={styles.barChartContainer}>
              <View style={styles.barChartYAxis}>
                <Text style={[styles.barChartYLabel, { color: colors.textSecondary }]}>100%</Text>
                <Text style={[styles.barChartYLabel, { color: colors.textSecondary }]}>75%</Text>
                <Text style={[styles.barChartYLabel, { color: colors.textSecondary }]}>50%</Text>
                <Text style={[styles.barChartYLabel, { color: colors.textSecondary }]}>25%</Text>
                <Text style={[styles.barChartYLabel, { color: colors.textSecondary }]}>0%</Text>
              </View>
              
              <View style={styles.barChartContent}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 120, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Mon</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 80, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Tue</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 150, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Wed</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 100, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Thu</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 70, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Fri</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 40, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Sat</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 30, backgroundColor: colors.primary }]} />
                  <Text style={[styles.barChartXLabel, { color: colors.textSecondary }]}>Sun</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Task Distribution */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Task Distribution</Text>
            <PieChart size={20} color={colors.primary} />
          </View>
          
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.pieChartContainer}>
              <View style={styles.pieChartPlaceholder}>
                {/* Placeholder for actual pie chart */}
                <View style={[styles.pieSegment, styles.pieSegment1]} />
                <View style={[styles.pieSegment, styles.pieSegment2]} />
                <View style={[styles.pieSegment, styles.pieSegment3]} />
                <View style={[styles.pieSegment, styles.pieSegment4]} />
                <View style={[styles.pieChartInner, { backgroundColor: colors.card }]}>
                  <Text style={[styles.pieChartTotal, { color: colors.text }]}>64</Text>
                  <Text style={[styles.pieChartTotalLabel, { color: colors.textSecondary }]}>Tasks</Text>
                </View>
              </View>
              
              <View style={styles.pieChartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Work (45%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Personal (25%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Health (15%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Shopping (15%)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={[styles.chartContainer, { marginBottom: 24 }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Daily Activity</Text>
          </View>
          
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <View style={styles.timelineContainer}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineTime}>
                    <Text style={[styles.timelineTimeText, { color: colors.textSecondary }]}>{8 + index * 2}:00</Text>
                  </View>
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: colors.text }]}>
                      {['Team Meeting', 'Project Review', 'Lunch Break', 'Client Call', 'Email Responses', 'Wrap Up'][index]}
                    </Text>
                    <Text style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                      {['Discussed project timelines', 'Reviewed designs with team', 'Break', 'Presented to client', 'Responded to 15 emails', 'Prepared for tomorrow'][index]}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: COLORS.text,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scoreContainer: {
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreCircleContainer: {
    marginRight: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: COLORS.primary,
  },
  scoreNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: COLORS.primary,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
  },
  barChartYAxis: {
    width: 40,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  barChartYLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  barChartContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  barChartXLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  pieChartPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieSegment: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  pieSegment1: {
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '0deg' }],
    zIndex: 4,
    width: 75,
    left: 75,
    borderTopRightRadius: 75,
    borderBottomRightRadius: 75,
  },
  pieSegment2: {
    backgroundColor: COLORS.secondary,
    transform: [{ rotate: '90deg' }],
    zIndex: 3,
    width: 75,
    height: 75,
    right: 37.5,
    top: 0,
    borderTopRightRadius: 75,
  },
  pieSegment3: {
    backgroundColor: COLORS.accent,
    transform: [{ rotate: '135deg' }],
    zIndex: 2,
    width: 75,
    height: 75,
    right: 37.5,
    top: 75,
  },
  pieSegment4: {
    backgroundColor: COLORS.warning,
    transform: [{ rotate: '225deg' }],
    zIndex: 1,
    width: 75,
    height: 37.5,
    left: 0,
    bottom: 37.5,
  },
  pieChartInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pieChartTotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  pieChartTotalLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pieChartLegend: {
    flex: 1,
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timelineContainer: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineTime: {
    width: 50,
    alignItems: 'flex-end',
  },
  timelineTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: `${COLORS.primary}50`,
    paddingLeft: 16,
    marginLeft: -6,
  },
  timelineTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  timelineDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});