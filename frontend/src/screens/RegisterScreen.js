import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/RegisterStyles';

const API_BASE = "https://phrenologic-lindsy-abstractedly.ngrok-free.dev";

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }
        if (!agreed) {
            alert("Bạn cần đồng ý với điều khoản sử dụng.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    password: password, 
                    name: fullName 
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
                navigation.navigate('Login');
            } else {
                alert(data.detail || "Đăng ký thất bại.");
            }
        } catch (error) {
            alert("Lỗi kết nối Server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <Text style={styles.logoText}>SignLink</Text>
                <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Login')}>
                    <Ionicons name="person" size={20} color="#4317C6" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.card}>
                        {/* Header Info */}
                        <View style={styles.topIconSection}>
                            <View style={styles.iconBox}>
                                <Ionicons name="hand-right" size={32} color="white" />
                            </View>
                            <Text style={styles.cardTitle}>Create your account</Text>
                            <Text style={styles.cardSubtitle}>
                                Start translating sign language in{'\n'}seconds
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="rgba(121, 117, 135, 0.50)"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="name@example.com"
                                        placeholderTextColor="rgba(121, 117, 135, 0.50)"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="rgba(121, 117, 135, 0.50)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="rgba(121, 117, 135, 0.50)"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {/* Agreement */}
                            <TouchableOpacity 
                                style={styles.agreementSection}
                                onPress={() => setAgreed(!agreed)}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.checkbox, 
                                    agreed && { backgroundColor: '#4317C6', borderColor: '#4317C6' }
                                ]}>
                                    {agreed && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.agreementText}>
                                        I agree to the <Text style={styles.linkText}>Terms of Service</Text>{'\n'}and <Text style={styles.linkText}>Privacy Policy</Text>.
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Sign Up Button */}
                            <TouchableOpacity style={styles.signUpButton} onPress={handleRegister}>
                                <Text style={styles.signUpButtonText}>Sign Up</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footerSection}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
