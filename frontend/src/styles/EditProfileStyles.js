import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const editProfileStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fdf8ff',
    },
    container: {
        flex: 1,
    },

    // --- Header ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 64,
        backgroundColor: 'rgba(253, 248, 255, 0.8)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#4317c6',
        letterSpacing: -1,
    },

    // --- Content ---
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // --- Avatar Section ---
    avatarSection: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#f1ecf9',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#4317c6',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fdf8ff',
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1c1a24',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#484555',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 8,
        paddingHorizontal: 20,
    },

    // --- Form ---
    formGroup: {
        marginBottom: 24,
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
        backgroundColor: '#f7f1ff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#c9c4d8',
        height: 60,
        paddingHorizontal: 20,
    },
    textInput: {
        flex: 1,
        fontSize: 17,
        color: '#1c1a24',
        fontWeight: '500',
    },
    inputIconRight: {
        marginLeft: 12,
    },

    // --- Preferences Card ---
    prefsCard: {
        backgroundColor: '#f1ecf9',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(201, 196, 216, 0.3)',
    },
    prefsTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    prefsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1c1a24',
        marginBottom: 4,
    },
    prefsSubtitle: {
        fontSize: 13,
        color: '#484555',
        lineHeight: 18,
    },

    // --- Actions ---
    actionSection: {
        gap: 16,
    },
    saveButton: {
        height: 64,
        backgroundColor: '#4317c6',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#4317c6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    saveText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    discardButton: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discardText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ba1a1a',
    },

    // --- Logout Menu ---
    logoutMenu: {
        position: 'absolute',
        top: 35,
        right: 0,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 130,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1ecf9',
    },
    logoutMenuText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ba1a1a',
    },
});
