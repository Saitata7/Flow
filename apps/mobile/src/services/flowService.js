// services/flowService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const FLOWS_STORAGE_KEY = 'flows';

export const flowService = {
  async getFlows() {
    try {
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      return flowsData ? JSON.parse(flowsData) : [];
    } catch (error) {
      console.error('Error getting flows:', error);
      return [];
    }
  },

  async createFlow(flowData) {
    try {
      const flows = await this.getFlows();
      const newFlow = {
        id: flowData.id || Date.now().toString(), // Use provided ID or generate new one
        ...flowData,
        createdAt: flowData.createdAt || new Date().toISOString(),
      };
      flows.push(newFlow);
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(flows));
      return newFlow;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  },

  async updateFlow(id, updates) {
    try {
      const flows = await this.getFlows();
      const flowIndex = flows.findIndex(flow => flow.id === id);
      if (flowIndex !== -1) {
        flows[flowIndex] = { ...flows[flowIndex], ...updates };
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(flows));
        return flows[flowIndex];
      }
      throw new Error('Flow not found');
    } catch (error) {
      console.error('Error updating flow:', error);
      throw error;
    }
  },

  async deleteFlow(id) {
    try {
      const flows = await this.getFlows();
      const filteredFlows = flows.filter(flow => flow.id !== id);
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(filteredFlows));
      return true;
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  },

  async completeFlow(id, date) {
    try {
      const flows = await this.getFlows();
      const flowIndex = flows.findIndex(flow => flow.id === id);
      if (flowIndex !== -1) {
        const flow = flows[flowIndex];
        if (!flow.status) flow.status = {};
        flow.status[date] = {
          symbol: '✅',
          timestamp: new Date().toISOString(),
        };
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(flows));
        return flows[flowIndex];
      }
      throw new Error('Flow not found');
    } catch (error) {
      console.error('Error completing flow:', error);
      throw error;
    }
  },
};
