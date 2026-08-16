import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/chatService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const history = await chatService.getHistory(user?.id);
      setMessages(history);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input, user);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Balance', value: 'What\'s my balance?' },
    { label: 'Earnings', value: 'How do I earn more?' },
    { label: 'Payout', value: 'How to withdraw?' }
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="chatbubble" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Karkade AI</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>👋</Text>
                  <Text style={styles.emptyTitle}>Hello!</Text>
                  <Text style={styles.emptySubtitle}>
                    Ask me about your earnings, races, or dealer campaigns.
                  </Text>
                  <View style={styles.quickActions}>
                    {quickActions.map((action, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickAction}
                        onPress={() => setInput(action.value)}
                      >
                        <Text style={styles.quickActionText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.message,
                      msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.content}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))
              )}
              {isLoading && (
                <View style={styles.loadingMessage}>
                  <Text style={styles.loadingDots}>...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#666"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    maxHeight: 700,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 5, textAlign: 'center' },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  quickAction: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickActionText: { color: '#fff', fontSize: 12 },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
  },
  messageText: { color: '#fff', fontSize: 14 },
  messageTime: { color: '#9CA3AF', fontSize: 10, marginTop: 4 },
  loadingMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 12,
  },
  loadingDots: { color: '#fff', fontSize: 20 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
