// components/WelcomePopup.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../../../styles';
import useWelcomePopup from '../../hooks/useWelcomePopup';

const WelcomePopup = ({ children }) => {
  const { showWelcomePopup, markWelcomePopupSeen } = useWelcomePopup();

  const handleClose = () => {
    markWelcomePopupSeen();
  };

  return (
    <>
      {children}
      <Modal
        visible={showWelcomePopup}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.title}>Welcome to Flow Tracker! 🌊</Text>
            <Text style={styles.description}>
              Start tracking your daily flows and build better habits. 
              Tap anywhere to continue.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  popup: {
    backgroundColor: colors.light.background,
    borderRadius: 12,
    padding: layout.spacing.lg,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  description: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    marginBottom: layout.spacing.lg,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.light.primaryOrange,
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.styles.headline,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default WelcomePopup;
