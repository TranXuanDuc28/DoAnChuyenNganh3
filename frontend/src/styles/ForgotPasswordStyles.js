import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const forgotPasswordStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fdf8ff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },

    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        marginTop: 10,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#4317c6',
        letterSpacing: -1,
    },
    closeButton: {
        padding: 8,
    },

    // --- Content ---
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: '#1c1a24',
        textAlign: 'center',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        color: '#484555',
        textAlign: 'center',
        lineHeight: 26,
        marginTop: 12,
        paddingHorizontal: 10,
        opacity: 0.8,
    },

    // --- Card ---
    card: {
        backgroundColor: '#f8f4ff',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 40,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(201, 196, 216, 0.4)',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#484555',
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#c9c4d8',
        height: 64,
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#1c1a24',
    },

    // --- Button ---
    submitButton: {
        height: 64,
        backgroundColor: '#6344f3',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },

    // --- Back Link ---
    divider: {
        height: 1,
        backgroundColor: '#c9c4d8',
        marginVertical: 24,
        opacity: 0.3,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    backText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4317c6',
    },

    // --- Footer ---
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    supportText: {
        fontSize: 14,
        color: '#484555',
    },
    supportLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4317c6',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 32,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#797587',
        fontWeight: '600',
    },
    copyrightText: {
        fontSize: 11,
        color: '#797587',
        textAlign: 'center',
        lineHeight: 16,
        opacity: 0.6,
        paddingHorizontal: 20,
    },
});
