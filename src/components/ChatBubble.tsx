import React from 'react';
import { View, Text } from 'react-native';
import type { ChatMessage } from '../store/chatStore';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-brand-700 rounded-tr-sm'
            : 'bg-stone-800 rounded-tl-sm'
        }`}
      >
        <Text className="text-white text-sm leading-5">{message.content}</Text>
      </View>
      {message.warning && (
        <View className="mt-1 max-w-[85%] bg-yellow-900/60 rounded-xl px-3 py-2">
          <Text className="text-yellow-300 text-xs leading-4">
            ⚠ {message.warning}
          </Text>
        </View>
      )}
    </View>
  );
}
