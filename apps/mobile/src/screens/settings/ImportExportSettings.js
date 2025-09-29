// screens/settings/ImportExportSettings.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ImportExportSettings = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { flows = [] } = useContext(FlowsContext) || {};
  const [isExporting, setIsExporting] = useState(false);

  const generateExportData = () => {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      flows: flows.filter(flow => !flow.deletedAt).map(flow => ({
        id: flow.id,
        title: flow.title,
        description: flow.description,
        trackingType: flow.trackingType,
        createdAt: flow.createdAt,
        status: flow.status,
        cheatMode: flow.cheatMode,
        archived: flow.archived
      })),
      metadata: {
        totalFlows: flows.filter(flow => !flow.deletedAt).length,
        platform: Platform.OS,
        appVersion: '1.0.0'
      }
    };
    return JSON.stringify(exportData, null, 2);
  };

  const exportToXLS = async () => {
    try {
      setIsExporting(true);
      
      // Generate CSV data (simplified XLS format)
      const csvData = generateCSVData();
      const fileName = `flow_data_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Flow Data',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSVData = () => {
    const headers = ['Flow ID', 'Title', 'Description', 'Tracking Type', 'Created Date', 'Status Count', 'Cheat Mode', 'Archived'];
    const rows = flows.filter(flow => !flow.deletedAt).map(flow => [
      flow.id,
      `"${flow.title || ''}"`,
      `"${flow.description || ''}"`,
      flow.trackingType || '',
      flow.createdAt || '',
      Object.keys(flow.status || {}).length,
      flow.cheatMode ? 'Yes' : 'No',
      flow.archived ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const exportToSheets = async () => {
    try {
      setIsExporting(true);
      
      const jsonData = generateExportData();
      const fileName = `flow_data_${new Date().toISOString().split('T')[0]}.json`;
      
      // For iOS, we'll use the Share API to open in Numbers/Sheets
      await Share.share({
        message: `Flow Data Export - ${fileName}`,
        url: `data:application/json;base64,${Buffer.from(jsonData).toString('base64')}`,
        title: 'Export Flow Data'
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Import Data',
      'Import functionality is coming soon! This feature will allow you to import data from CSV or JSON files with specific formatting requirements.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    backButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 16,
    },
    featureDescription: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      lineHeight: 22,
      marginBottom: 16,
    },
    exportOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    exportIcon: {
      marginRight: 16,
    },
    exportInfo: {
      flex: 1,
    },
    exportTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    exportDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      lineHeight: 18,
    },
    exportButton: {
      backgroundColor: themeColors.primaryOrange,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    exportButtonText: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: '#fff',
    },
    importSection: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderStyle: 'dashed',
    },
    importTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 8,
    },
    importDescription: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      lineHeight: 22,
      marginBottom: 16,
    },
    comingSoonBadge: {
      backgroundColor: themeColors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    comingSoonText: {
      fontSize: typography.sizes.caption2,
      fontWeight: typography.weights.semibold,
      color: '#fff',
    },
    statsSection: {
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    statsTitle: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    statsLabel: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
    },
    statsValue: {
      fontSize: typography.sizes.caption1,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  const activeFlows = flows.filter(flow => !flow.deletedAt);
  const archivedFlows = flows.filter(flow => flow.archived && !flow.deletedAt);
  const totalStatusEntries = flows.reduce((total, flow) => total + Object.keys(flow.status || {}).length, 0);

  return (
    <SafeAreaWrapper style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Import & Export</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Data Statistics */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Your Data</Text>
          <View style={dynamicStyles.statsSection}>
            <View style={dynamicStyles.statsRow}>
              <Text style={dynamicStyles.statsLabel}>Active Flows</Text>
              <Text style={dynamicStyles.statsValue}>{activeFlows.length}</Text>
            </View>
            <View style={dynamicStyles.statsRow}>
              <Text style={dynamicStyles.statsLabel}>Archived Flows</Text>
              <Text style={dynamicStyles.statsValue}>{archivedFlows.length}</Text>
            </View>
            <View style={dynamicStyles.statsRow}>
              <Text style={dynamicStyles.statsLabel}>Total Status Entries</Text>
              <Text style={dynamicStyles.statsValue}>{totalStatusEntries}</Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Export Data</Text>
          <Text style={dynamicStyles.featureDescription}>
            Export your flow data to backup or transfer to another device. Choose the format that works best for your needs.
          </Text>

          {/* Android XLS Export */}
          <TouchableOpacity 
            style={dynamicStyles.exportOption}
            onPress={exportToXLS}
            disabled={isExporting}
          >
            <View style={dynamicStyles.exportIcon}>
              <Ionicons name="document-text-outline" size={24} color={themeColors.primaryOrange} />
            </View>
            <View style={dynamicStyles.exportInfo}>
              <Text style={dynamicStyles.exportTitle}>Export to CSV/XLS</Text>
              <Text style={dynamicStyles.exportDescription}>
                Export data as CSV file (compatible with Excel, Google Sheets)
              </Text>
            </View>
            <TouchableOpacity 
              style={dynamicStyles.exportButton}
              onPress={exportToXLS}
              disabled={isExporting}
            >
              <Text style={dynamicStyles.exportButtonText}>
                {isExporting ? 'Exporting...' : 'Export'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* iOS Sheets Export */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={dynamicStyles.exportOption}
              onPress={exportToSheets}
              disabled={isExporting}
            >
              <View style={dynamicStyles.exportIcon}>
                <Ionicons name="grid-outline" size={24} color={themeColors.primaryOrange} />
              </View>
              <View style={dynamicStyles.exportInfo}>
                <Text style={dynamicStyles.exportTitle}>Export to Numbers/Sheets</Text>
                <Text style={dynamicStyles.exportDescription}>
                  Export data for Apple Numbers or Google Sheets
                </Text>
              </View>
              <TouchableOpacity 
                style={dynamicStyles.exportButton}
                onPress={exportToSheets}
                disabled={isExporting}
              >
                <Text style={dynamicStyles.exportButtonText}>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {/* Import Section */}
        <View style={dynamicStyles.importSection}>
          <View style={dynamicStyles.comingSoonBadge}>
            <Text style={dynamicStyles.comingSoonText}>Coming Soon</Text>
          </View>
          <Text style={dynamicStyles.importTitle}>Import Data</Text>
          <Text style={dynamicStyles.importDescription}>
            Import data from CSV or JSON files. Specific formatting requirements will be provided when this feature is available.
          </Text>
          <Button
            title="Import Data"
            onPress={handleImport}
            variant="secondary"
            disabled={true}
          />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default ImportExportSettings;
