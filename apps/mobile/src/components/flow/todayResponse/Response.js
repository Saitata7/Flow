import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { ThemeContext } from '../../../context/ThemeContext';
import { colors, layout, typography } from '../../../../styles';

const emotions = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Angry', emoji: '😠' },
  { label: 'Excited', emoji: '🎉' },
  { label: 'Calm', emoji: '😌' },
];

const ResponseModal = ({
  visible,
  onClose,
  onSubmit,
  onSkip,
  onBack,
  showBackButton,
  title,
  note,
  setNote,
  selectedEmotion,
  setSelectedEmotion,
  children,
  modalStage,
  trackingType,
}) => {
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const themeColors = theme === 'light' ? colors.light : colors.dark;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {modalStage === 'input' && children}
          {modalStage === 'note_emotion' && (
            <>
              <Text style={styles.sectionTitle}>How do you feel?</Text>
              <View style={styles.emotionGrid}>
                {emotions.map((emotion) => (
                  <TouchableOpacity
                    key={emotion.label}
                    style={[
                      styles.emotionButton,
                      selectedEmotion?.label === emotion.label && styles.emotionButtonSelected,
                    ]}
                    onPress={() => setSelectedEmotion(emotion)}
                    accessibilityLabel={`Select ${emotion.label} emotion`}
                    accessibilityHint={`Tap to select ${emotion.label} as your emotion`}
                  >
                    <Text style={styles.emotionButtonText}>
                      {emotion.emoji} {emotion.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Enter your note..."
                placeholderTextColor="#666"
                multiline
              />
            </>
          )}
          <View style={styles.modalActions}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={onBack}
                accessibilityLabel="Go back to previous step"
                accessibilityHint="Tap to return to the previous input step"
              >
                <Text style={styles.modalButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={onSubmit}
              accessibilityLabel="Submit response"
              accessibilityHint="Tap to submit your response and save the flow status"
            >
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={onSkip}
              accessibilityLabel="Skip response"
              accessibilityHint="Tap to skip adding notes and emotions"
            >
              <Text style={styles.modalButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.spacing.md,
  },
  modalContent: {
    backgroundColor: colors.light.background,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: layout.spacing.md,
    color: colors.light.primaryText,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: layout.spacing.md,
    marginTop: layout.spacing.sm,
    color: colors.light.primaryText,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  emotionButton: {
    backgroundColor: colors.light.info,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  emotionButtonSelected: {
    backgroundColor: colors.light.primaryOrange,
  },
  emotionButtonText: {
    color: colors.light.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    height: 96,
    textAlignVertical: 'top',
    marginBottom: layout.spacing.md,
    fontSize: typography.sizes.md,
    color: colors.light.primaryText,
  },
  modalActions: {
    flexDirection: 'row',
    gap: layout.spacing.md,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    backgroundColor: colors.light.info,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.light.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});

export default ResponseModal;
