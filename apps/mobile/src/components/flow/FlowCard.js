import React, { useContext } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlowsContext } from '../../context/FlowContext';

const HomePage = ({ navigation }) => {
  const { flows } = useContext(FlowsContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Flows</Text>
        <Button title="Add" onPress={() => navigation.navigate('AddFlow')} />
      </View>

      <FlatList
        data={flows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.flow}>
            <Text style={styles.flowTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>{item.everyDay ? 'Every Day' : 'Custom Days'}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  flow: { marginTop: 16, padding: 10, borderWidth: 1, borderRadius: 8 },
  flowTitle: { fontWeight: 'bold' },
});
