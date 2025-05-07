import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart2, ChartPie as PieChart, TrendingUp, Clock, Calendar, FileText, ChevronDown } from 'lucide-react-native';
import { getTaskStats } from '@/lib/tasks';
import { subscribeToTasks } from '@/lib/tasks';

// Define theme colors
const COLORS = {
  primary: '#3E64FF',
  secondary: '#38B2AC',
  accent: '#9F7AEA',
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  border: '#E2E8F0',
  success: '#48BB78',
  warning: '#F6AD55',
  error: '#F56565',
};

export default function AnalyticsScreen() {
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
    const subscription = subscribeToTasks(() => loadStats());
    return () => subscription.unsubscribe();
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>Last 30 Days</Text>
          <ChevronDown size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Calendar size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryNumber}>{stats.total}</Text>
            <Text style={styles.summaryText}>Total Tasks</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${COLORS.success}20` }]}>
              <FileText size={20} color={COLORS.success} />
            </View>
            <Text style={styles.summaryNumber}>{stats.completed}</Text>
            <Text style={styles.summaryText}>Completed</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${COLORS.error}20` }]}>
              <Clock size={20} color={COLORS.error} />
            </View>
            <Text style={styles.summaryNumber}>{stats.pending}</Text>
            <Text style={styles.summaryText}>Pending</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Completion Rate</Text>
            <TrendingUp size={20} color={COLORS.success} />
          </View>
          
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircleContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{Math.round(stats.completionRate)}%</Text>
              </View>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreDetailText}>
                {stats.completed} out of {stats.total} tasks completed
              </Text>
            </View>
          </View>
        </View>

        {/* Task Completion Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Task Completion Rate</Text>
            <BarChart2 size={20} color={COLORS.primary} />
          </View>
          
          <View style={styles.chartCard}>
            {/* Placeholder for actual chart */}
            <View style={styles.barChartContainer}>
              <View style={styles.barChartYAxis}>
                <Text style={styles.barChartYLabel}>100%</Text>
                <Text style={styles.barChartYLabel}>75%</Text>
                <Text style={styles.barChartYLabel}>50%</Text>
                <Text style={styles.barChartYLabel}>25%</Text>
                <Text style={styles.barChartYLabel}>0%</Text>
              </View>
              
              <View style={styles.barChartContent}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 120, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Mon</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 80, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Tue</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 150, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Wed</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 100, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Thu</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 70, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Fri</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 40, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Sat</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: 30, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.barChartXLabel}>Sun</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Task Distribution */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Task Distribution</Text>
            <PieChart size={20} color={COLORS.primary} />
          </View>
          
          <View style={styles.chartCard}>
            <View style={styles.pieChartContainer}>
              <View style={styles.pieChartPlaceholder}>
                {/* Placeholder for actual pie chart */}
                <View style={[styles.pieSegment, styles.pieSegment1]} />
                <View style={[styles.pieSegment, styles.pieSegment2]} />
                <View style={[styles.pieSegment, styles.pieSegment3]} />
                <View style={[styles.pieSegment, styles.pieSegment4]} />
                <View style={styles.pieChartInner}>
                  <Text style={styles.pieChartTotal}>64</Text>
                  <Text style={styles.pieChartTotalLabel}>Tasks</Text>
                </View>
              </View>
              
              <View style={styles.pieChartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Work (45%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.secondary }]} />
                  <Text style={styles.legendText}>Personal (25%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.accent }]} />
                  <Text style={styles.legendText}>Health (15%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.legendText}>Shopping (15%)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={[styles.chartContainer, { marginBottom: 24 }]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Daily Activity</Text>
          </View>
          
          <View style={styles.chartCard}>
            <View style={styles.timelineContainer}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineTime}>
                    <Text style={styles.timelineTimeText}>{8 + index * 2}:00</Text>
                  </View>
                  <View style={styles.timelineLine}>
                    <View style={styles.timelineDot} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      {['Team Meeting', 'Project Review', 'Lunch Break', 'Client Call', 'Email Responses', 'Wrap Up'][index]}
                    </Text>
                    <Text style={styles.timelineDescription}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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