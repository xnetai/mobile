import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {TradingScreen} from './src/screens/TradingScreen';
import {PositionsScreen} from './src/screens/PositionsScreen';
import {useTradingStore} from './src/store/tradingStore';
import {Text, StyleSheet} from 'react-native';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const initialize = useTradingStore(state => state.initialize);
  const cleanup = useTradingStore(state => state.cleanup);

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerStyle: styles.header,
          headerTintColor: '#FFF',
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        <Tab.Screen
          name="Trade"
          component={TradingScreen}
          options={{
            tabBarLabel: 'Trade',
            tabBarIcon: ({color}) => (
              <Text style={[styles.tabIcon, {color}]}>💹</Text>
            ),
            headerTitle: 'Perpetual Trading',
          }}
        />
        <Tab.Screen
          name="Positions"
          component={PositionsScreen}
          options={{
            tabBarLabel: 'Positions',
            tabBarIcon: ({color}) => (
              <Text style={[styles.tabIcon, {color}]}>📊</Text>
            ),
            headerTitle: 'My Positions',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  header: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#2C2C2E',
    borderBottomWidth: 1,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 24,
  },
});

export default App;
