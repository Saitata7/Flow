import React, { useContext } from 'react';
import { View, Text, FlatList, Button, SafeAreaView, StyleSheet } from 'react-native';
import { HabitsContext } from '../../context/HabitContext';

const HomePage = ({ navigation }) => {
  const { habits } = useContext(HabitsContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        <Button title="Add" onPress={() => navigation.navigate('AddHabit')} />
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.habit}>
            <Text style={styles.habitTitle}>{item.title}</Text>
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
  habit: { marginTop: 16, padding: 10, borderWidth: 1, borderRadius: 8 },
  habitTitle: { fontWeight: 'bold' },
});
