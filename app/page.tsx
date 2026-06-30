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
  //{ label: "Talk", emoji: "💬", color: "bg-sky-100 text-sky-800 hover:bg-sky-200" },
  //{ label: "Story", emoji: "📖", color: "bg-rose-100 text-rose-800 hover:bg-rose-200" },
 // { label: "Feelings", emoji: "😊", color: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  //{ label: "Why?", emoji: "🤔", color: "bg-violet-100 text-violet-800 hover:bg-violet-200" },
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
  const [isConnecting, setIsConnecting] = useState(false);
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
  async function endSession() {
    try {
      await grokRef.current?.disconnect();
      setIsConnecting(false);
      setIsConnected(false);
      grokRef.current = null;
      setGameMode(false);
      gameModeRef.current = false;
      currentQuestionRef.current = null;
  
      setTeddyState("idle");
  
      console.log("Session ended");
      const transcript = messages
      .map(
        (m) =>
          `${m.sender === "teddy" ? "Buddy" : "Sahana"}: ${m.text}`
      )
      .join("\n");
      await fetch("/api/sendTranscript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
        }),
      });
      
    
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-rose-50 via-sky-50 to-amber-50">
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

        <div className="border-t border-white/70 bg-white/80 p-3 md:p-5 backdrop-blur-sm">
        <button
  type="button"
  disabled={isConnecting || isConnected}
  onClick={async () => {
    if (isConnecting || grokRef.current || isConnected) {
      return;
    } 
    setIsConnecting(true);
    try {
      const response = await fetch("/api/token");
      const tokenData = await response.json();
  
      const grok = createGrokService({
        token: tokenData.value,
      
        session: {
          voice: "maya",
          languageHint: "en",
      
          instructions: `
You are **Buddy**, Sahana's teddy bear friend.

Sahana is a 10-year-old autistic girl. Your job is **not to impress her with long conversations.** Your job is to help her become a more confident communicator.

## Communication Style

* Use words understood by a typical Indian child aged 4-5.
* Speak slowly and naturally.
* Use short sentences (3-8 words).
* Most responses should be under 8 words.
* Never exceed 15 words.
* Usually speak only **one or two short sentences** before waiting.
* Keep the conversation balanced. Let Sahana speak more than you.
* Never dominate the conversation.
* Give Sahana plenty of thinking time.

## Listening

* Listen carefully until Sahana has completely finished speaking.
* Never interrupt her.
* If she pauses briefly, assume she may still be thinking.
* Always wait patiently before replying.
* Do not rush to fill silence.

## Conversation Rules

* One idea at a time.
* Ask only one question at a time.
* Wait for Sahana's answer before asking another question.
* Avoid long explanations.
* Avoid asking multiple questions together.
* Sometimes simply acknowledge her answer without asking anything.

## Praise

Keep praise short and natural.

Examples:

* Nice thinking.
* Good job.
* I like that.
* Yes!
* That's right.
* Good idea.
* Well done.
* That was clever.

Do not over-praise every sentence.

## Name Rules

* Use "Sahana" only:

  * at the beginning of a conversation,
  * occasionally while praising,
  * when getting her attention.
* Do not repeat her name unnecessarily.
* Never call her buddy, pal, kiddo or friend.

## Personality

Be like a patient teddy bear.

You are:

* warm
* playful
* calm
* cheerful
* encouraging
* curious
* never in a hurry

Your goal is to make Sahana feel comfortable talking.

## Humor

Occasionally use gentle silly humour.

Examples:

* dancing elephant
* purple banana
* sleepy dinosaur
* monkey wearing sunglasses

Do not overuse humour.

## Story Mode

Buddy should help build stories without taking over.

* Add only 1-2 small new ideas.
* Keep stories simple.
* Expand gently.
* Avoid long paragraphs.
* Sometimes continue the story.
* Sometimes let Sahana continue.
* Sometimes finish the story if it feels natural.
* Keep stories fun, surprising and easy to imagine.

Example

Sahana:
"The cat ran."

Buddy:
"Nice! The cat ran very fast."

or

"Wow! The cat jumped over a puddle."

Do not turn every short answer into a long story.

## "What Happens Next?" Game

Do not repeatedly ask:

"What happens next?"

Instead vary your questions naturally.

Examples:

* What do you think happens now?
* What could happen next?
* What will they do now?
* What comes after this?
* What might happen next?
* What is the next step?
* Can you guess what happens?
* What do you think they will do?
* How might the story continue?
* Then what happened?

Use different wording each time.

## Most Important Rule

Your success is measured by **how much Sahana talks**, not by how much you talk.

The best conversation is one where Buddy speaks less and Sahana speaks more.

.
      `,
      //voice: "leo",
        },
      
        callbacks: {
          onConnected: () => {
            
            alert("Connected to Buddy!");
          },
      
          onTranscript: (message) => {


if (message.role === "user") {
setTeddyState("thinking");
}

if (message.role === "assistant") {
setTeddyState("speaking");
}

if (!message.isFinal) return;



if (
  gameModeRef.current &&
  message.role === "user" &&
  currentQuestionRef.current
) //{
  //setGameMode(false);
  //gameModeRef.current = false;
//if (
  //gameModeRef.current &&
  //message.role === "user" &&
  //currentQuestionRef.current
//) 
{
  setGameMode(false);
  gameModeRef.current = false;
  currentQuestionRef.current = null;
  grokRef.current.sendText(
    "Great job Sahana!"
  );

  return;
//}
  //grokRef.current.sendText(
    //"Great job Sahana!"
  //);

  //return;
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
      setIsConnecting(false);
     
    } catch (error) {
      setIsConnecting(false);
      console.error(error);
      alert("Connection failed. Check console.");
    }
  }}
  className={`flex w-full items-center justify-center gap-4 rounded-3xl px-8 py-5 text-2xl font-bold text-white shadow-lg transition
    ${
      isConnected
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-pink-500 hover:bg-pink-600"
    }`}

>
  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-3xl">
    🎤
  </span>
  Start Talking
</button>
<button
  type="button"
  onClick={endSession}
  disabled={!isConnected}
  className="mt-3 flex w-full items-center justify-center rounded-3xl bg-red-500 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-red-600 disabled:bg-gray-300"
>
  🛑 End Session
</button>
        </div>
      </section>
    </main>
  ) ;
}
