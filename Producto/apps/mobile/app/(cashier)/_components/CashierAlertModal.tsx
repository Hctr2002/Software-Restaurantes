import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { X, AlertTriangle, Send } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface CashierAlertModalProps {
  visible: boolean;
  isSending: boolean;
  onClose: () => void;
  onSend: (tableNum: string, message: string) => Promise<void>;
}

export default function CashierAlertModal({ visible, isSending, onClose, onSend }: CashierAlertModalProps) {
  const { colors } = useTheme();
  const [tableNum, setTableNum] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    await onSend(tableNum, message);
    setTableNum('');
    setMessage('');
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.centered}
        >
          <TouchableOpacity 
            style={styles.dismissArea} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          <Animated.View 
            entering={FadeInDown.springify()} 
            style={[styles.modalContent, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <AlertTriangle size={20} color="#f59e0b" />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>ALERTA AL ADMIN</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>N° DE MESA (OPCIONAL)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  placeholder="Ej. 3"
                  placeholderTextColor={colors.muted}
                  value={tableNum}
                  onChangeText={setTableNum}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>MENSAJE DE EMERGENCIA</Text>
                <TextInput 
                  style={[styles.input, styles.textArea, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  placeholder="Explica el problema aquí..."
                  placeholderTextColor={colors.muted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: '#f59e0b' }]}
                onPress={handleSend}
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>ENVIAR ALERTA</Text>
                    <Send size={18} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1 
  },
  dismissArea: { 
    flex: 1 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 18, 
    fontWeight: '900', 
    fontStyle: 'italic' 
  },
  closeBtn: { 
    padding: 4 
  },
  body: { 
    gap: 20 
  },
  inputGroup: { 
    gap: 8 
  },
  label: { 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  input: { 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderWidth: 1, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top',
    paddingTop: 14
  },
  footer: { 
    paddingTop: 24, 
    paddingBottom: 20 
  },
  sendBtn: { 
    height: 56, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  sendBtnText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '900', 
    letterSpacing: 1 
  }
});
