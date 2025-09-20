// src/screens/plans/ExportPlan.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import usePlans from '../../hooks/usePlans';

const ExportPlan = ({ navigation, route }) => {
  const { planId } = route.params;
  const { getPlanDetails } = usePlans();
  const insets = useSafeAreaInsets();

  const { data: plan, isLoading } = getPlanDetails(planId);
  const [isExporting, setIsExporting] = useState(false);

  const currentPlan = plan;
  
  if (!currentPlan) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Plan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleExportAsText = async () => {
    setIsExporting(true);
    try {
      const exportText = generatePlanText(currentPlan);
      await Share.share({
        message: exportText,
        title: `Export: ${currentPlan.title}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export plan. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAsJSON = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        title: currentPlan.title,
        description: currentPlan.description,
        category: currentPlan.category,
        visibility: currentPlan.visibility,
        steps: currentPlan.steps,
        createdAt: currentPlan.createdAt,
        exportedAt: new Date().toISOString(),
      };
      
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: `Export: ${currentPlan.title} (JSON)`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export plan. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generatePlanText = (plan) => {
    let text = `Plan: ${plan.title}\n\n`;
    text += `Description: ${plan.description}\n\n`;
    text += `Category: ${plan.category.charAt(0).toUpperCase() + plan.category.slice(1)}\n`;
    text += `Visibility: ${plan.visibility === 'public' ? 'Public' : 'Private'}\n\n`;
    
    if (plan.steps && plan.steps.length > 0) {
      text += `Steps:\n`;
      plan.steps.forEach((step, index) => {
        text += `${index + 1}. ${step.title} (${step.duration} minute${step.duration !== 1 ? 's' : ''})\n`;
      });
    }
    
    text += `\nExported from Flow App`;
    return text;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Export Plan
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Info */}
        <View style={styles.planInfo}>
          <View style={styles.planHeader}>
            <View style={styles.categoryBadge}>
              <Icon
                name="calendar-outline"
                size={16}
                color={colors.light.primaryOrange}
              />
              <Text style={styles.categoryText}>
                {currentPlan.category.charAt(0).toUpperCase() + currentPlan.category.slice(1)}
              </Text>
            </View>
            <View style={styles.visibilityBadge}>
              <Icon
                name={currentPlan.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                size={16}
                color={colors.light.secondaryText}
              />
              <Text style={styles.visibilityText}>
                {currentPlan.visibility === 'public' ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          <Text style={styles.planTitle}>{currentPlan.title}</Text>
          <Text style={styles.description}>{currentPlan.description}</Text>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Icon name="list-outline" size={20} color={colors.light.secondaryText} />
              <Text style={styles.statText}>
                {currentPlan.steps?.length || 0} step{(currentPlan.steps?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="time-outline" size={20} color={colors.light.secondaryText} />
              <Text style={styles.statText}>
                {currentPlan.steps?.reduce((total, step) => total + step.duration, 0) || 0} minutes total
              </Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          
          <View style={styles.exportOption}>
            <View style={styles.exportOptionHeader}>
              <Icon name="document-text-outline" size={24} color={colors.light.primaryOrange} />
              <View style={styles.exportOptionContent}>
                <Text style={styles.exportOptionTitle}>Export as Text</Text>
                <Text style={styles.exportOptionDescription}>
                  Share as readable text format
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              title="Export"
              onPress={handleExportAsText}
              disabled={isExporting}
              style={styles.exportButton}
            />
          </View>

          <View style={styles.exportOption}>
            <View style={styles.exportOptionHeader}>
              <Icon name="code-outline" size={24} color={colors.light.primaryOrange} />
              <View style={styles.exportOptionContent}>
                <Text style={styles.exportOptionTitle}>Export as JSON</Text>
                <Text style={styles.exportOptionDescription}>
                  Share as structured data format
                </Text>
              </View>
            </View>
            <Button
              variant="secondary"
              title="Export"
              onPress={handleExportAsJSON}
              disabled={isExporting}
              style={styles.exportButton}
            />
          </View>
        </View>

        {/* Steps Preview */}
        {currentPlan.steps && currentPlan.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps Preview</Text>
            {currentPlan.steps.map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDuration}>{step.duration} minute{step.duration !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  title: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: layout.spacing.md,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  content: {
    flex: 1,
  },
  planInfo: {
    backgroundColor: colors.light.cardBackground,
    margin: layout.spacing.lg,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.primaryOrangeVariants.light,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  categoryText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    marginLeft: layout.spacing.xs,
    fontWeight: '600',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.progressBackground,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  visibilityText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginLeft: layout.spacing.xs,
  },
  planTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.sm,
  },
  description: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: layout.spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  statText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  section: {
    marginHorizontal: layout.spacing.lg,
    marginBottom: layout.spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
  },
  exportOption: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.md,
    ...layout.shadows.small,
  },
  exportOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  exportOptionContent: {
    flex: 1,
    marginLeft: layout.spacing.md,
  },
  exportOptionTitle: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  exportOptionDescription: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  exportButton: {
    alignSelf: 'flex-start',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    ...layout.shadows.small,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.md,
  },
  stepNumberText: {
    ...typography.styles.headline,
    color: colors.light.cardBackground,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  stepDuration: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
});

export default ExportPlan;
