import React, { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 border-t border-stone-800 bg-stone-900">
      <TextInput
        className="flex-1 bg-stone-800 text-white rounded-2xl px-4 py-3 text-sm max-h-28"
        placeholder="Ask about trails, refuges, gear..."
        placeholderTextColor="#6b7280"
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
        onSubmitEditing={handleSend}
        blurOnSubmit
      />
      <Pressable
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          disabled || !text.trim() ? 'bg-stone-700' : 'bg-brand-700'
        }`}
      >
        <Text className="text-white text-lg">↑</Text>
      </Pressable>
    </View>
  );
}
