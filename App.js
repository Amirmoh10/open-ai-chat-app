import { polyfillGlobal } from "react-native/Libraries/Utilities/PolyfillFunctions";
import { ReadableStream } from "web-streams-polyfill";
import { fetch } from "react-native-fetch-api";
// import TextEncoder from "react-native-fast-encoder";
import { TextDecoder } from "text-decoding";
import { OPENAI_API_KEY } from "react-native-dotenv";

polyfillGlobal("ReadableStream", () => ReadableStream);
polyfillGlobal("TextDecoder", () => TextEncoder);

polyfillGlobal(
  "fetch",
  () =>
    (...args) =>
      fetch(args[0], { ...args[1], reactNative: { textStreaming: true } })
);
polyfillGlobal("Headers", () => Headers);
polyfillGlobal("Request", () => Request);
polyfillGlobal("Response", () => Response);

import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Platform,
  Text,
  FlatList,
  View,
  TextInput,
  Button,
} from "react-native";
import { useState } from "react";

export default function App() {
  return (
    <SafeAreaView style={styles.parentContainer}>
      <Chat />
    </SafeAreaView>
  );
}

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    const userMessage = { role: "user", content: inputText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [...messages, userMessage],
          }),
        }
      );

      const reader = response.body.getReader();

      const decoded = new TextDecoder();
      let botResponse = "";

      const processStream = async () => {
        const processChunk = async () => {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }

          const chunk = decoded.decode(new Uint8Array([value]));
          botResponse += chunk;
          setMessages([...messages, { role: "assistant", content: result }]);
          setTimeout(processChunk);
        };
        processChunk();
      };
      processStream();
    } catch (error) {
      console.error("Error during API call:", error);
    }

    setInputText("");
  };

  const renderMessage = ({ item }) => (
    <Text style={item.role === "user" ? styles.userMessage : styles.botMessage}>
      {item.content}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Text>Hybrid Heroes Chat</Text>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 10,
  },
  messagesList: {
    flex: 1,
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ececec",
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginRight: 10,
    borderRadius: 10,
  },
});
