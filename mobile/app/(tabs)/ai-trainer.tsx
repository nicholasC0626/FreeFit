import { useMemo, useRef, useState } from "react";
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

import { useTheme, type Theme } from "../../constants/theme";
import { generateAiProgram, sendChat, type ChatMessage } from "../../services/ai.service";
import { getApiErrorMessage } from "../../utils/api-error";

const SUGGESTIONS = [
  "How much protein should I eat?",
  "Best exercises for chest growth?",
  "How do I break a plateau?",
];

export default function AiTrainerScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
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
            <ActivityIndicator color={t.onAccent} size="small" />
          ) : (
            <Text style={styles.generateButtonText}>Generate program</Text>
          )}
        </Pressable>
      </View>
      <Text style={styles.subtitle}>AI replies may take 30–60 seconds</Text>

      <View style={styles.toolRow}>
        <Pressable style={styles.toolButton} onPress={() => router.navigate("/ai/program-review")}>
          <Text style={styles.toolButtonText}>Review my program</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => router.navigate("/ai/exercise-suggest")}>
          <Text style={styles.toolButtonText}>Exercise ideas</Text>
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
            <Pressable style={styles.suggestion} onPress={() => router.navigate("/(tabs)/training")}>
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
            <ActivityIndicator size="small" color={t.textMuted} />
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
          placeholderTextColor={t.textFaint}
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

const createStyles = (t: Theme) =>
  StyleSheet.create({
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
      color: t.text,
    },
    subtitle: {
      fontSize: 12,
      color: t.textMuted,
      paddingHorizontal: 20,
      paddingBottom: 4,
    },
    toolRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    toolButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    toolButtonText: {
      color: t.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    generateButton: {
      backgroundColor: t.primarySolid,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    generateButtonText: {
      color: t.onAccent,
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
      color: t.textSecondary,
      marginBottom: 16,
    },
    suggestion: {
      backgroundColor: t.chip,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    suggestionText: {
      color: t.primary,
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
      backgroundColor: t.cta,
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: t.chip,
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
    },
    userBubbleText: {
      color: t.onAccent,
      fontSize: 14,
      lineHeight: 20,
    },
    assistantBubbleText: {
      color: t.text,
      fontSize: 14,
      lineHeight: 20,
    },
    errorText: {
      color: t.danger,
      marginTop: 4,
    },
    inputRow: {
      flexDirection: "row",
      gap: 8,
      padding: 12,
      paddingHorizontal: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: t.text,
    },
    sendButton: {
      backgroundColor: t.cta,
      borderRadius: 12,
      paddingHorizontal: 18,
      justifyContent: "center",
    },
    sendButtonText: {
      color: t.onAccent,
      fontWeight: "700",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
