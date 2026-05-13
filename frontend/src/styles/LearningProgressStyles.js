import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(253, 248, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 196, 216, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#5D3FDF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 30,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4317C6',
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif-condensed',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5DEFF',
  },
  scrollContent: {
    paddingBottom: 128,
  },
  mainPadding: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 32,
  },
  headerTitleSection: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1A24',
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif-bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#5E5D69',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  bentoGrid: {
    gap: 20,
  },
  overallCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F0FF',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5D3FDF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  progressCircleContainer: {
    width: 128,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressCircleSvg: {
    position: 'absolute',
    width: 128,
    height: 128,
  },
  progressTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 16,
    color: '#4317C6',
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif',
  },
  progressLabel: {
    fontSize: 16,
    color: '#5E5D69',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  weeklyGoalSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  weeklyGoalLabel: {
    fontSize: 16,
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  weeklyGoalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif-bold',
  },
  statsSubGrid: {
    gap: 12,
  },
  statCard: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakIconBg: {
    backgroundColor: '#FFEDD5',
  },
  xpIconBg: {
    backgroundColor: 'rgba(91, 60, 221, 0.2)',
  },
  statLabel: {
    fontSize: 16,
    color: '#5E5D69',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  statValue: {
    fontSize: 16,
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif',
  },
  activitySection: {
    backgroundColor: '#F7F1FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  activityTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif-bold',
  },
  activityPeriod: {
    fontSize: 16,
    color: '#5E5D69',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 32,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 16,
    height: 144,
    backgroundColor: 'rgba(229, 224, 238, 0.4)',
    borderRadius: 9999,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  barFill: {
    width: '100%',
    borderRadius: 9999,
  },
  activeBarFill: {
    height: 144,
  },
  activeBarLabel: {
    position: 'absolute',
    top: -30,
    backgroundColor: '#4317C6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeBarLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif-bold',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5E5D69',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif-medium',
  },
  activeDayLabel: {
    color: '#4317C6',
    fontWeight: '700',
  },
  coursesSection: {
    gap: 20,
  },
  sectionHeader: {
    fontSize: 16,
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Space Grotesk' : 'sans-serif',
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F0FF',
    padding: 20,
    gap: 12,
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseMain: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  courseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 16,
    color: '#1C1A24',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  courseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif-bold',
  },
  courseProgressText: {
    fontSize: 16,
    color: '#4317C6',
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  courseProgressBarTrack: {
    height: 12,
    backgroundColor: '#E5E0EE',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  courseProgressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#5B3CDD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(253, 248, 255, 0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 196, 216, 0.3)',
    borderRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: '#5B3CDD',
  },
  navLabel: {
    fontSize: 10,
    color: '#908DA1',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'sans-serif',
  },
  activeNavLabel: {
    color: '#D7CFFF',
  },
});

