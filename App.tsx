import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useTradingStore} from './src/store/tradingStore';
import {useWalletStore} from './src/store/walletStore';
import {Text, StyleSheet} from 'react-native';

// Import screens
import {WalletSetupScreen} from './src/screens/WalletSetupScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {SpotTradingScreen} from './src/screens/SpotTradingScreen';
import {TradingScreen} from './src/screens/TradingScreen';
import {PositionsScreen} from './src/screens/PositionsScreen';
import {SendScreen} from './src/screens/SendScreen';
import {ReceiveScreen} from './src/screens/ReceiveScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs(): React.JSX.Element {
  return (
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
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color}) => (
            <Text style={[styles.tabIcon, {color}]}>🏠</Text>
          ),
          headerTitle: 'CryptoWallet',
        }}
      />
      <Tab.Screen
        name="Spot"
        component={SpotTradingScreen}
        options={{
          tabBarLabel: 'Spot',
          tabBarIcon: ({color}) => (
            <Text style={[styles.tabIcon, {color}]}>💰</Text>
          ),
          headerTitle: 'Spot Trading',
        }}
      />
      <Tab.Screen
        name="Perpetuals"
        component={TradingScreen}
        options={{
          tabBarLabel: 'Perpetuals',
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
  );
}

function App(): React.JSX.Element {
  const initialize = useTradingStore(state => state.initialize);
  const cleanup = useTradingStore(state => state.cleanup);
  const {isInitialized} = useWalletStore();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  useEffect(() => {
    // Check if wallet is initialized
    setWalletReady(isInitialized);
  }, [isInitialized]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: '#FFF',
          headerTitleStyle: styles.headerTitle,
        }}>
        {!walletReady ? (
          <Stack.Screen
            name="WalletSetup"
            options={{headerShown: false}}>
            {props => (
              <WalletSetupScreen
                {...props}
                onComplete={() => setWalletReady(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Send"
              component={SendScreen}
              options={{
                headerTitle: 'Send',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Receive"
              component={ReceiveScreen}
              options={{
                headerTitle: 'Receive',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
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
  headerTitle: {
    color: '#FFF',
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
