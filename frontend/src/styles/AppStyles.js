import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8FF' },

    // --- Header ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: 'rgba(253, 248, 255, 0.9)',
    },
    profilePic: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' },
    appTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
        letterSpacing: -0.5,
        flex: 1,
    },
    langToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F2F6',
        borderRadius: 20,
        padding: 3,
        marginRight: 10,
    },
    langBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    langBtnActive: {
        backgroundColor: '#6C5CE7',
    },
    langText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#A4B0BE',
    },
    langTextActive: {
        color: '#FFF',
    },
    settingsBtn: {
        padding: 8,
    },

    // --- Camera Viewfinder ---
    cameraWrapper: {
        flex: 1,
        marginHorizontal: 15,
        marginBottom: 95, // Chừa khoảng trống cho Bottom Tab (85 height + 10 margin)
        borderRadius: 30,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
    },
    webView: { flex: 1 },

    // Khung focus trên camera
    focusFrame: {
        position: 'absolute',
        top: '10%',
        left: '10%',
        right: '10%',
        bottom: '10%',
        borderWidth: 2,
        borderColor: 'rgba(108, 92, 231, 0.5)',
        borderRadius: 20,
        zIndex: 5,
    },
    cornerTL: { position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#6C5CE7', borderTopLeftRadius: 20 },
    cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#6C5CE7', borderBottomRightRadius: 20 },

    // Nút chức năng nổi bên phải
    floatingActions: {
        position: 'absolute',
        right: 15,
        top: 20,
        gap: 15,
        zIndex: 20,
    },
    actionBtn: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    actionBtnPrimary: { backgroundColor: '#6C5CE7' },

    // --- Result Card (Glassmorphism) ---
    resultCard: {
        position: 'absolute',
        bottom: 140, // Đưa lên trên Bottom Tab
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 25,
        padding: 20,
        height: 160, // SỬ DỤNG CHIỀU CAO CỐ ĐỊNH (FIXED HEIGHT)
        zIndex: 100,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    liveStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6C5CE7', marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: 'bold', color: '#6C5CE7', letterSpacing: 1 },

    translationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    translationText: { fontSize: 20, fontWeight: '600', color: '#2D3436', flex: 1, lineHeight: 28 },
    ttsBtn: { backgroundColor: '#D1CCFF', padding: 10, borderRadius: 12, marginLeft: 10 },

    waveformContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3, marginTop: 15 },
    waveBar: { width: 3, height: 15, backgroundColor: '#6C5CE7', borderRadius: 2 },

    // --- Bottom Tab Navigation ---
    bottomTab: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#FFF', // Đổi sang trắng cho sạch sẽ
        height: 85,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20, // Thêm padding cho các máy có thanh Home
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    tabItem: { alignItems: 'center', justifyContent: 'center' },
    tabActive: { backgroundColor: '#6C5CE7', width: 60, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontSize: 10, color: '#636E72', marginTop: 4 },
    tabTextActive: { color: '#FFF' },

    // --- Overlay Connection Error ---
    errorOverlay: { position: 'absolute', top: 10, alignSelf: 'center', backgroundColor: 'rgba(255, 59, 48, 0.9)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, zIndex: 100 },
    errorText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});
