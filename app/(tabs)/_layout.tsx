import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: Colors[colorScheme ?? "light"].border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Horarios",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="calendar.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="BlogScreen"
        options={{
          title: "Blog",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="newspaper.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ScheduleByProfScreen"
        options={{
          title: "Profesores",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.2.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="PsicologosScreen"
        options={{
          title: "Psicólogos",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.wave.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tedis"
        options={{
          title: "TDIS",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="book.closed.circle.fill"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="justificantes"
        options={{
          title: "Justificantes",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="book.closed.circle.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
