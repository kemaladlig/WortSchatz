import { BookOpen, Layers, Trophy } from '@tamagui/lucide-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTheme } from 'tamagui';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.color.val,
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                    borderTopColor: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Practice',
                    tabBarIcon: ({ color }) => <Layers color={color} />,
                }}
            />
            <Tabs.Screen
                name="quiz"
                options={{
                    title: 'Quiz',
                    tabBarIcon: ({ color }) => <Trophy color={color} />,
                }}
            />
            <Tabs.Screen
                name="learn"
                options={{
                    title: 'Learn',
                    tabBarIcon: ({ color }) => <BookOpen color={color} />,
                }}
            />
        </Tabs>
    );
}
