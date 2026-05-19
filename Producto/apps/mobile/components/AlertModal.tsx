import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type AlertType = 'TABLE_ISSUE' | 'BILL_REQUEST' | 'STOCK_SHORTAGE' | 'HELP_REQUEST' | 'GENERAL';

const ALERT_OPTIONS: { type: AlertType; label: string }[] = [
  { type: 'TABLE_ISSUE', label: 'Problema en Mesa' },
  { type: 'BILL_REQUEST', label: 'Pedir Cuenta' },
  { type: 'HELP_REQUEST', label: 'Necesito Ayuda' },
  { type: 'GENERAL', label: 'Mensaje General' },
];
interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (type: AlertType, message: string, tableNum?: string) => Promise<boolean>;
}

export default function AlertModal({ visible, onClose, onSend }: AlertModalProps) {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = React.useState<AlertType>('HELP_REQUEST');
  const [message, setMessage] = React.useState('');
  const [tableNum, setTableNum] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    const success = await onSend(selectedType, message, tableNum);
    setLoading(false);
    if (success) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setMessage('');
        setTableNum('');
        onClose();
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View entering={SlideInDown} style={[styles.content, { backgroundColor: colors.navy }]}>
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                  <AlertTriangle size={24} color="#FF9800" />
                </View>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>Canal de Emergencia</Text>
                  <Text style={[styles.subtitle, { color: colors.muted }]}>Notificación directa al admin</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              <Text style={[styles.label, { color: colors.muted }]}>TIPO DE ALERTA</Text>
              <View style={styles.optionsGrid}>
                {ALERT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setSelectedType(opt.type)}
                    style={[
                      styles.optionBtn,
                      { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                      selectedType === opt.type && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: colors.muted },
                      selectedType === opt.type && { color: 'white' }
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.muted }]}>N° MESA (OPCIONAL)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.glass, color: colors.text, borderColor: colors.glassHeavy }]}
                    placeholder="Ej. 5"
                    placeholderTextColor={colors.muted}
                    value={tableNum}
                    onChangeText={setTableNum}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.muted }]}>DESCRIPCIÓN DEL PROBLEMA</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.glass, color: colors.text, borderColor: colors.glassHeavy }]}
                placeholder="Escribe los detalles aquí..."
                placeholderTextColor={colors.muted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={loading || sent || !message.trim()}
                style={[
                  styles.sendBtn,
                  { backgroundColor: colors.brandAccent },
                  (loading || sent || !message.trim()) && { opacity: 0.5 }
                ]}
              >
                {sent ? (
                  <>
                    <Text style={styles.sendBtnText}>ENVIADO</Text>
                    <CheckCircle2 size={18} color="white" />
                  </>
                ) : loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>EMITIR ALERTA</Text>
                    <AlertTriangle size={18} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  container: {
    width: '100%',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingBottom: 40,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  sendBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  sendBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});
