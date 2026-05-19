import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export function RatingModal({ visible, onClose, onSubmit, primaryColor, bgColor, textColor }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(300)} style={[styles.card, { backgroundColor: bgColor, borderColor: textColor + '10' }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <X color={textColor + '40'} size={20} />
          </TouchableOpacity>

          {done ? (
            <Animated.View entering={FadeIn} style={styles.doneContainer}>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={[styles.doneTitle, { color: textColor }]}>¡Gracias por tu valoración!</Text>
              <Text style={[styles.doneSubtitle, { color: textColor + '40' }]}>Tu opinión nos ayuda a mejorar</Text>
              <TouchableOpacity style={[styles.doneButton, { backgroundColor: primaryColor }]} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              <Text style={styles.emoji}>⭐</Text>
              <Text style={[styles.title, { color: textColor }]}>¿Cómo fue tu experiencia?</Text>
              <Text style={[styles.subtitle, { color: textColor + '40' }]}>Tu pedido fue entregado. Cuéntanos qué te pareció.</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
                    <Star
                      size={38}
                      color={n <= rating ? '#f59e0b' : textColor + '20'}
                      fill={n <= rating ? '#f59e0b' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Animated.View entering={FadeIn} style={styles.commentContainer}>
                  <TextInput
                    style={[styles.commentInput, { color: textColor, borderColor: primaryColor + '66', backgroundColor: textColor + '08' }]}
                    placeholder="Deja un comentario (opcional)"
                    placeholderTextColor={textColor + '30'}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                  />
                </Animated.View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: rating > 0 ? primaryColor : 'rgba(255,255,255,0.1)' },
                  submitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.submitText}>Enviar valoración</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: textColor + '30' }]}>Omitir</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  starBtn: {
    padding: 4,
  },
  commentContainer: {
    width: '100%',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: 12,
    padding: 8,
  },
  skipText: {
    fontSize: 13,
  },
  doneContainer: {
    alignItems: 'center',
    gap: 10,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
