"use client";

import { useState, useEffect, useRef } from "react";
import { createGrokService } from "../lib/grok";
import Teddy from "../components/Teddy";
import curriculum from "../data/curriculum.json";

type ChatMessage = {
  id: string;
  sender: "teddy" | "child";
  text: string;
};

const MODE_BUTTONS = [
  { label: "Talk", emoji: "💬", color: "bg-sky-100 text-sky-800 hover:bg-sky-200" },
  { label: "Story", emoji: "📖", color: "bg-rose-100 text-rose-800 hover:bg-rose-200" },
  { label: "Feelings", emoji: "😊", color: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  { label: "Why?", emoji: "🤔", color: "bg-violet-100 text-violet-800 hover:bg-violet-200" },
  { label: "What Next?", emoji: "🔮", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
];



function ChatBubble({ message }: { message: ChatMessage }) {
  const isTeddy = message.sender === "teddy";
  
  return (
    <div className={`flex ${isTeddy ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-5 py-4 text-lg leading-relaxed shadow-sm ${
          isTeddy
            ? "rounded-bl-lg bg-sky-200 text-sky-950"
            : "rounded-br-lg bg-pink-200 text-pink-950"
        }`}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
          {isTeddy ? "🧸 Buddy" : "👧 Sahana"}
        </p>
        <p>{message.text}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [teddyState, setTeddyState] =
  useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  const grokRef = useRef<any>(null);
  const gameModeRef = useRef(false);
const currentQuestionRef = useRef<any>(null);
  const [selectedMode, setSelectedMode] = useState("Talk");
const [questionIndex, setQuestionIndex] = useState(0);
const [currentQuestion, setCurrentQuestion] =
  useState<any>(null);
const [stars, setStars] = useState(0)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "teddy",
      text: "Hello Sahana! Let's talk?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  
  useEffect(() => {
if (
    typeof window !== "undefined" &&
    !audioContextRef.current
  ) {
    audioContextRef.current = new window.AudioContext({
      sampleRate: 24000,
    });
  }
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  function startWhatNextGame() {
    const question = curriculum[0];
  
     
    setQuestionIndex(0);

setCurrentQuestion(question);
currentQuestionRef.current = question;

setGameMode(true);
gameModeRef.current = true;
  
    askCurrentQuestion(question);
  }
  
  function askCurrentQuestion(question: any) {
    if (!grokRef.current) return;
  
    grokRef.current.sendText(`
      Read EXACTLY the text below.
      
      ${question.question}
      
      Choice 1:
      ${question.choices[0]}
      
      Choice 2:
      ${question.choices[1]}
      
      Choice 3:
      ${question.choices[2]}
      
      After reading the question:
      - Wait for Sahana's answer.
      - Do not tell her if she is correct.
      - Do not ask another question.
      - Do not continue the game.
      `);
  }
  return (
    <main className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gradient-to-br from-rose-50 via-sky-50 to-amber-50">
      <section className="flex w-[40%] flex-col border-r border-white/70 bg-white/50 backdrop-blur-sm">
      <Teddy
  state={teddyState}
  
/>
      </section>

      <section className="flex w-[60%] flex-col">
        <div className="border-b border-white/70 bg-white/70 px-5 py-4 backdrop-blur-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Choose a way to talk
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {MODE_BUTTONS.map((button) => (
              <button
              key={button.label}
              type="button"
              onClick={() => {
                setSelectedMode(button.label);
            
                if (button.label === "What Next?") {
                  startWhatNextGame();
                }
              }}
                className={`rounded-full px-5 py-2.5 text-base font-semibold shadow-sm transition-transform hover:scale-105 active:scale-95 ${button.color}`}
              >
                {button.emoji} {button.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
  <ChatBubble key={message.id} message={message} />
))}

<div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/80 p-5 backdrop-blur-sm">
        <button
  type="button"
  onClick={async () => {
    try {
      const response = await fetch("/api/token");
      const tokenData = await response.json();
  
      const grok = createGrokService({
        token: tokenData.value,
      
        session: {
          voice: "maya",
          languageHint: "en",
      
          instructions: `
You are Buddy, Sahana's teddy bear friend.

Sahana is a 10 year old autistic child.

You are Buddy, Sahana's teddy bear friend.

Sahana is a 10-year-old autistic child.

Communication Style:

* Use words understood by a typical Indian child aged 4-5.
* Use short sentences of 3-8 words.
* Use simple everyday school and home vocabulary.
* One idea at a time.
* Ask only one question at a time.
* Wait for Sahana's answer.
* Avoid long explanations.
* Most responses should be under 8 words.
* Never exceed 15 words.

Name Rules:

* Use "Sahana" at the start of a conversation.
* Use "Sahana" when praising her.
* Do not use her name repeatedly.
* Never call her buddy, pal, friend, or kiddo.

Personality:

* Be warm, playful, cheerful and encouraging.
* Use praise often.
* Use expressions like:
  "Wow!"
  "Good idea!"
  "That's funny!"
  "Nice thinking!"
  "I like that!"
  "That made me smile!"

Humor:

* Occasionally use gentle silly humor.
* Examples: dancing elephant, purple banana, sleepy dinosaur, monkey with sunglasses.

Story Mode:

* Buddy tells most of the story.
* Add new ideas, places, characters and funny events.
* Do not simply repeat Sahana's words.
* Expand short answers.
* Use praise and excitement more often in your response.

Example:
Sahana: "The cat ran."
Buddy: "Wow! The cat ran fast and jumped over a puddle."
*Use more 
* Add 1-3 new details when continuing a story.
* Ask for Sahana's input only once every 3-5 story turns.
* Do not ask "What happened next?" repeatedly.
* Sometimes continue the story yourself.
* Sometimes finish the story yourself.
* Keep stories fun, simple and surprising.
* Use praise and excitement more often in your response. 
* Examples: If Sahana says: "A lion came." Buddy may say: "Wow! A big lion came running from the jungle!" If Sahana says: "The lion ate food." Buddy may say: "Haha! The lion was very hungry. He ate five bananas!" - Use praise and excitement more often in your response.
.
      `,
      //voice: "leo",
        },
      
        callbacks: {
          onConnected: () => {
            console.log("✅ Connected to Grok");
            alert("Connected to Buddy!");
          },
      
          onTranscript: (message) => {
console.log("Transcript:", message);

if (message.role === "user") {
setTeddyState("thinking");
}

if (message.role === "assistant") {
setTeddyState("speaking");
}

if (!message.isFinal) return;
console.log(
  "FINAL MESSAGE:",
  message.role,
  message.text
);
if (
  gameModeRef.current &&
  message.role === "user" &&
  currentQuestionRef.current
) {
  grokRef.current.sendText(
    "Great job Sahana! You got it right."
  );
  return;
} 
if (message.role === "assistant") {
  setShowStars(true);

  setTimeout(() => {
    setShowStars(false);
  }, 2500);
}
const text = message.text.trim();
const praiseWords = [
  "great job",
  "well done",
  "awesome",
  "excellent",
  "good job",
  "nice work",
  "fantastic",
  "wonderful",
  "you got it",
];

const isPraise = praiseWords.some((word) =>
  text.toLowerCase().includes(word)
);

if (message.role === "assistant" && isPraise) {
  setShowStars(true);

  setTimeout(() => {
    setShowStars(false);
  }, 2500);
}
setMessages((prev) => {
const messageId =
message.itemId ||
message.responseId ||
crypto.randomUUID();


const existingIndex = prev.findIndex(
  (m) => m.id === messageId
);

if (existingIndex >= 0) {
  const updated = [...prev];

  updated[existingIndex] = {
    ...updated[existingIndex],
    text,
  };

  return updated;
}

return [
  ...prev,
  {
    id: messageId,
    sender:
      message.role === "assistant"
        ? "teddy"
        : "child",
    text,
  },
];


});

if (message.role === "assistant") {
setTimeout(() => {
setTeddyState("idle");
}, 1500);
}
},

onAudio: (message) => {
  if (!audioContextRef.current) return;
  if (message.audio.byteLength === 0) return;

  const pcm16 = new Int16Array(message.audio);

  const hasSound = pcm16.some(
    (sample) => sample !== 0
  );

  if (!hasSound) return;

  const float32 = new Float32Array(pcm16.length);

  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768;
  }

  const audioBuffer =
    audioContextRef.current.createBuffer(
      1,
      float32.length,
      24000
    );

  audioBuffer
    .getChannelData(0)
    .set(float32);

  const source =
    audioContextRef.current.createBufferSource();

  source.buffer = audioBuffer;

  source.connect(
    audioContextRef.current.destination
  );

  const ctx = audioContextRef.current;

  const startTime = Math.max(
    ctx.currentTime,
    nextPlayTimeRef.current
  );

  source.start(startTime);

  nextPlayTimeRef.current =
    startTime + audioBuffer.duration;
},
      
          onError: (error) => {
            console.error("Grok Error:", error);
          },
        },
      });
      grokRef.current = grok;
      setTeddyState("listening");
      await grok.connect();
  
      console.log("Starting microphone...");
      await grok.startMicrophone();
      setIsConnected(true);
      alert("🎤 Buddy is listening!");
    } catch (error) {
      console.error(error);
      alert("Connection failed. Check console.");
    }
  }}
  className="flex w-full items-center justify-center gap-4 rounded-3xl bg-pink-500 px-8 py-5 text-2xl font-bold text-white shadow-lg transition hover:bg-pink-600"
>
  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-3xl">
    🎤
  </span>
  Start Talking
</button>
        </div>
      </section>
    </main>
  ) ;
}
