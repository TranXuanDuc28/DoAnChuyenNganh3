import React from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles/QuizResultStyles';

const QuizResultScreen = ({ navigation, route }) => {
    // Expecting results from route.params
    // { results: [ { question, user_choice, correct_answer, isCorrect, video_url }, ... ], score, total }
    const { results = [], score = 0, total = 0, category = "General" } = route.params || {};

    const xpEarned = score * 15; // 15 XP per correct answer
    const progressPercent = Math.min((xpEarned / 200) * 100, 100); // Assume 200 XP is daily goal

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Top Navigation Bar */}
            <View style={styles.topNav}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="sparkles" size={20} color="#4317C6" />
                    <Text style={styles.headerTitle}>Lumina Sign</Text>
                </View>
                <Image 
                    source={{ uri: 'https://i.pravatar.cc/100?u=alex' }} 
                    style={styles.avatar} 
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
                
                {/* XP Gradient Card */}
                <LinearGradient
                    colors={['#7B61FF', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.xpCard}
                >
                    <View style={styles.xpIconContainer}>
                        <FontAwesome5 name="medal" size={30} color="white" />
                    </View>
                    <Text style={styles.xpLabel}>Experience Points</Text>
                    <Text style={styles.xpValue}>+{xpEarned} XP</Text>
                    
                    <View style={styles.xpProgressBackground}>
                        <View style={[styles.xpProgressBar, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.xpGoalText}>{Math.round(progressPercent)}% of today's goal</Text>
                </LinearGradient>

                {/* Results Summary Card */}
                <View style={styles.resultSummaryCard}>
                    <Text style={styles.categoryTag}>{category} RESULTS</Text>
                    <Text style={styles.congratsTitle}>Great job,{"\n"}User!</Text>
                    <Text style={styles.congratsSub}>
                        You've completed the {category}{"\n"}quiz with an impressive result.
                    </Text>

                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreMain}>{score}</Text>
                        <Text style={styles.scoreSub}>/ {total} correct{"\n"}answers</Text>
                    </View>
                </View>

                {/* Questions Details Header */}
                <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#4317C6" />
                    <Text style={styles.sectionTitle}>Question Details</Text>
                </View>

                {/* Detailed Questions List */}
                {results.map((item, index) => (
                    <View key={index} style={styles.questionDetailCard}>
                        {item.isCorrect ? <View style={styles.correctIndicator} /> : <View style={styles.wrongIndicator} />}
                        
                        <View style={styles.qHeader}>
                            <View style={[
                                styles.statusIcon, 
                                { backgroundColor: item.isCorrect ? '#DCFCE7' : '#FFDAD6' }
                            ]}>
                                <Ionicons 
                                    name={item.isCorrect ? "checkmark" : "close"} 
                                    size={16} 
                                    color={item.isCorrect ? "#16A34A" : "#BA1A1A"} 
                                />
                            </View>
                            
                            <View style={styles.qContent}>
                                <Text style={styles.qNum}>Question {index + 1}</Text>
                                <Text style={styles.qTitle}>{item.question}</Text>
                                
                                {/* User Choice */}
                                <View style={[
                                    styles.choiceRow, 
                                    item.isCorrect ? styles.userChoiceBg : styles.userChoiceWrongBg
                                ]}>
                                    <Text style={[
                                        styles.choiceLabel,
                                        !item.isCorrect && styles.userChoiceWrongText
                                    ]}>Your choice:</Text>
                                    <Text style={[
                                        styles.userChoiceText,
                                        !item.isCorrect && styles.userChoiceWrongText
                                    ]}>{item.user_choice}</Text>
                                </View>

                                {/* Correct Answer (Only show if user was wrong) */}
                                {!item.isCorrect && (
                                    <View style={[styles.choiceRow, styles.correctChoiceBg]}>
                                        <Text style={[styles.choiceLabel, styles.correctChoiceLabel]}>Correct answer:</Text>
                                        <Text style={[styles.userChoiceText, styles.correctChoiceText]}>{item.correct_answer}</Text>
                                    </View>
                                )}

                                {/* Action Button for this question */}
                                {item.isCorrect ? (
                                    <TouchableOpacity style={styles.watchAgainBtn}>
                                        <Ionicons name="play-circle" size={20} color="#451CC8" />
                                        <Text style={styles.watchAgainText}>Watch again</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.relearnBtn}>
                                        <LinearGradient
                                            colors={['#7B61FF', '#A78BFA']}
                                            style={styles.relearnGradient}
                                        >
                                            <Ionicons name="refresh" size={18} color="white" />
                                            <Text style={styles.relearnText}>Relearn this</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                ))}

                {/* Bottom Actions */}
                <View style={styles.footerActions}>
                    <TouchableOpacity 
                        style={styles.backBtn}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Ionicons name="home-outline" size={20} color="#4317C6" />
                        <Text style={styles.backText}>Back to Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.continueBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={['#7B61FF', '#A78BFA']}
                            style={styles.continueGradient}
                        >
                            <Ionicons name="arrow-forward" size={18} color="white" />
                            <Text style={styles.continueText}>Continue Learning</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default QuizResultScreen;
