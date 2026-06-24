import TeddyBear, { type TeddyState } from "./TeddyBear";

export type { TeddyState };

const STATUS_OPTIONS: {
  value: TeddyState;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: "idle", label: "Idle", emoji: "😊", color: "bg-sky-100 text-sky-700 ring-sky-200" },
  { value: "listening", label: "Listening", emoji: "👂", color: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  { value: "thinking", label: "Thinking", emoji: "💭", color: "bg-amber-100 text-amber-700 ring-amber-200" },
  { value: "speaking", label: "Speaking", emoji: "💬", color: "bg-violet-100 text-violet-700 ring-violet-200" },
];

type TeddyProps = {
  state?: TeddyState;
  showStars?: boolean;
};

export default function Teddy({
  state = "idle",
  showStars = false,
}: TeddyProps) {
  return (

    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-8">
  <div className="relative flex items-center justify-center">

  {showStars && (
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-bounce z-20">
        ⭐⭐⭐
      </div>
    )}

    {state === "thinking" && (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-5xl animate-bounce">
        💭
      </div>
    )}

    {state === "speaking" && (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-5xl animate-pulse">
        💬
      </div>
    )}
  
   
  <div
  className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${
    state === "listening"
      ? "bg-green-500/90 scale-150"
      : state === "speaking"
      ? "bg-violet-400/70 scale-125"
      : state === "thinking"
      ? "bg-yellow-400/70 scale-125"
      : "bg-amber-200/35"
  }`}
/>

    <TeddyBear
state={state}
className={`relative h-72 w-72 drop-shadow-xl transition-all duration-500 sm:h-80 sm:w-80 ${
    state === "thinking"
      ? "-rotate-6"
      : state === "speaking"
      ? "animate-bounce"
      : ""
  }`}
/>

</div>

      <div className="text-center">
      <h2 className="text-2xl font-bold text-center">
  Hi Sahana,
  <br />
  This is Buddy!
</h2></div>

<div
  className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-lg shadow ring-1 ${
    state === "idle"
      ? "bg-sky-100 text-sky-700 ring-sky-200"
      : state === "listening"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : state === "thinking"
      ? "bg-amber-100 text-amber-700 ring-amber-200"
      : "bg-violet-100 text-violet-700 ring-violet-200"
  }`}
>
  {STATUS_OPTIONS.find(
    (option) => option.value === state
  )?.emoji}
</div>
    </div>
  );
}
