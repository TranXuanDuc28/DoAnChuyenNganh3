import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    SafeAreaView, 
    StatusBar,
    ActivityIndicator,
    BlurView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { styles } from '../styles/QuizStyles';

import { API_BASE } from '../constants/Config';

const QuizScreen = ({ navigation, route }) => {
    const { categoryId, categoryName } = route.params || { categoryId: 1, categoryName: 'General' };
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleNext = () => {
        if (selectedOption === null && currentIndex < questions.length) {
            // Optional: Handle skip logic or just return
            // For now let's assume they must select or it counts as wrong
        }

        const currentQuestion = questions[currentIndex];
        const isCorrect = selectedOption !== null && currentQuestion.options[selectedOption] === currentQuestion.correct_answer;
        
        const currentResult = {
            question: currentQuestion.question_text,
            user_choice: selectedOption !== null ? currentQuestion.options[selectedOption] : "Skipped",
            correct_answer: currentQuestion.correct_answer,
            isCorrect: isCorrect,
            video_url: currentQuestion.video_url
        };

        const newScore = isCorrect ? score + 1 : score;
        const newResults = [...results, currentResult];
        
        setScore(newScore);
        setResults(newResults);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsPlaying(false);
        } else {
            // Finish Quiz and Navigate
            navigation.navigate('QuizResult', {
                results: newResults,
                score: newScore,
                total: questions.length,
                category: currentQuestion.topic || categoryName || "Lesson"
            });
        }
    };

    const handlePlayPause = async () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    if (loading) return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color="#4317C6" />
        </SafeAreaView>
    );

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Top Navigation */}
            <View style={styles.topNav}>
                <View style={styles.logoContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color="#4317C6" />
                    </TouchableOpacity>
                    <Text style={styles.logoText}>Take Quiz</Text>
                </View>
                <View style={styles.timerBadge}>
                    <Ionicons name="time-outline" size={18} color="#4317C6" />
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
            >
                {/* Progress Header */}
                <View style={styles.headerWrapper}>
                    <Text style={styles.questionProgressText}>
                        QUESTION {(currentIndex + 1).toString().padStart(2, '0')}/{questions.length.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.categoryText}>
                        {currentQuestion.difficulty} • {currentQuestion.topic}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBackground}>
                    <LinearGradient
                        colors={['#7B61FF', '#A78BFA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                    />
                </View>

                {/* Question Title */}
                <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

                {/* Video Card */}
                <TouchableOpacity 
                    style={styles.videoCard} 
                    activeOpacity={0.9} 
                    onPress={handlePlayPause}
                >
                    {currentQuestion.video_url ? (
                        <View style={{ width: '100%', height: 190 }}>
                            <Video
                                ref={videoRef}
                                source={{ uri: `${API_BASE}/static/${currentQuestion.video_url}` }}
                                style={styles.videoPlaceholder}
                                resizeMode="contain"
                                shouldPlay={true}
                                useNativeControls={false}
                                isLooping
                                onPlaybackStatusUpdate={status => {
                                    setIsPlaying(status.isPlaying);
                                    if (status.error) {
                                        console.error("Video Error:", status.error);
                                    }
                                }}
                                onError={(e) => console.error("Video Load Error:", e)}
                            />
                        </View>
                    ) : (
                        <Image 
                            source={{ uri: 'https://placehold.co/340x190' }} 
                            style={styles.videoPlaceholder} 
                        />
                    )}
                    
                    {/* Viewfinder Corners */}
                    <View style={styles.markerContainer} pointerEvents="none">
                        <View style={[styles.markerBase, styles.markerTopLeft]} />
                        <View style={[styles.markerBase, styles.markerTopRight]} />
                        <View style={[styles.markerBase, styles.markerBottomLeft]} />
                        <View style={[styles.markerBase, styles.markerBottomRight]} />
                    </View>

                    {/* Replay Button */}
                    {!isPlaying && (
                        <View style={styles.replayButton} pointerEvents="none">
                            <Ionicons name="refresh" size={18} color="#4317C6" />
                            <Text style={styles.replayText}>Replay</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const isActive = selectedOption === index;
                        return (
                            <TouchableOpacity 
                                key={index}
                                style={[styles.optionCard, isActive && styles.optionCardActive]}
                                onPress={() => setSelectedOption(index)}
                            >
                                <View style={[styles.optionLetterBox, isActive && styles.optionLetterBoxActive]}>
                                    <Text style={[styles.optionLetter, isActive && styles.optionLetterActive]}>
                                        {letter}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                                    {option}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark-circle" size={24} color="#4317C6" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleNext}
                    disabled={selectedOption === null}
                >
                    <LinearGradient
                        colors={['#7B61FF', '#A78BFA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.nextButtonGradient, selectedOption === null && { opacity: 0.5 }]}
                    >
                        <Text style={styles.nextText}>Next Question</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default QuizScreen;
