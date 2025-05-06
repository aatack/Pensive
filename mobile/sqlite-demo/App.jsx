import React, { useEffect, useState } from "react";
import { Text, View, Button, StyleSheet } from "react-native";
import * as SQLite from "expo-sqlite"; // NEW API

export default function App() {
  const [items, setItems] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    (async () => {
      

      const db = await SQLite.openDatabaseAsync('databaseName');

      // `execAsync()` is useful for bulk queries when you want to execute altogether.
      // Note that `execAsync()` does not escape parameters and may lead to SQL injection.
      await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
      INSERT INTO test (value, intValue) VALUES ('test1', 123);
      INSERT INTO test (value, intValue) VALUES ('test2', 456);
      INSERT INTO test (value, intValue) VALUES ('test3', 789);
      `);
      
      // `runAsync()` is useful when you want to execute some write operations.
      const result = await db.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'aaa', 100);
      console.log(result.lastInsertRowId, result.changes);
      await db.runAsync('UPDATE test SET intValue = ? WHERE value = ?', 999, 'aaa'); // Binding unnamed parameters from variadic arguments
      await db.runAsync('UPDATE test SET intValue = ? WHERE value = ?', [999, 'aaa']); // Binding unnamed parameters from array
      await db.runAsync('DELETE FROM test WHERE value = $value', { $value: 'aaa' }); // Binding named parameters from object
      
      // `getFirstAsync()` is useful when you want to get a single row from the database.
      const firstRow = await db.getFirstAsync('SELECT * FROM test');
      console.log(firstRow.id, firstRow.value, firstRow.intValue);

    })();
  }, []);

  const addItem = async () => {
    // if (!db) return;

    // console.log("Adding");

    // const tx = await db.transactionAsync();
    // console.log("A")
    // await tx.executeSqlAsync("INSERT INTO items (name) VALUES (?)", ["Test Item"]);
    // console.log("B")
    // const result = await tx.executeSqlAsync("SELECT * FROM items");
    // console.log("C")
    // await tx.commitAsync();
    // console.log("D")

    // console.log(result.rows);
    // setItems(result.rows._array); // same structure as classic API
  };

  return (
    <View style={styles.container}>
      <Button title="Add Items" onPress={addItem} />
      {items.map((item, idx) => (
        <Text key={idx}>{item.name}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
});
