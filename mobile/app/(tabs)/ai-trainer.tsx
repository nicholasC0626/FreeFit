import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { generateAiProgram, sendChat, type ChatMessage } from "../../services/ai.service";
import { getApiErrorMessage } from "../../utils/api-error";

const SUGGESTIONS = [
  "How much protein should I eat?",
  "Best exercises for chest growth?",
  "How do I break a plateau?",
];

export default function AiTrainerScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isSending) {
      return;
    }
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setError(null);
    try {
      const reply = await sendChat(nextMessages.slice(-12));
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(getApiErrorMessage(err, "The AI trainer is unavailable right now."));
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateProgram = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const program = await generateAiProgram();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I created a program for you: "${program.name}" with ${program.workoutTemplates.length} workout days. Find it on the Training tab!`,
        },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate a program."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Trainer</Text>
        <Pressable
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          onPress={() => void handleGenerateProgram()}
          disabled={isGenerating || isSending}
        >
          {isGenerating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>Generate program</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ask me anything about training or nutrition.</Text>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                style={styles.suggestion}
                onPress={() => void send(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.suggestion} onPress={() => router.push("/(tabs)/training")}>
              <Text style={styles.suggestionText}>
                Or tap "Generate program" to get a custom lifting plan
              </Text>
            </Pressable>
          </View>
        ) : (
          messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.bubble,
                message.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={message.role === "user" ? styles.userBubbleText : styles.assistantBubbleText}
              >
                {message.content}
              </Text>
            </View>
          ))
        )}

        {isSending ? (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color="#6b7280" />
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI trainer..."
          editable={!isSending}
          onSubmitEditing={() => void send(input)}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, (isSending || !input.trim()) && styles.buttonDisabled]}
          onPress={() => void send(input)}
          disabled={isSending || !input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  generateButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  generateButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  chatContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  emptyState: {
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  suggestion: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  suggestionText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 14,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#111827",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#f3f4f6",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubbleText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  assistantBubbleText: {
    color: "#111827",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#dc2626",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
