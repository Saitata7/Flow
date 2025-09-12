import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';

const emotions = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Angry', emoji: '😣' },
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
  console.log('ResponseModal render:', { modalStage, trackingType });

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
              <TouchableOpacity style={styles.modalButton} onPress={onBack}>
                <Text style={styles.modalButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={onSubmit}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onSkip}>
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
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 8,
    color: '#333',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  emotionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  emotionButtonSelected: {
    backgroundColor: '#1E40AF',
  },
  emotionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    height: 96,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 18,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ResponseModal;