import ChatPage from "@/components/ChatPage";

export default function Page() {
  return (
    <div style={{ height: "100vh", width: "100%", background: "#F3FCF3" }}>
      <ChatPage
        apiUrl="/api/chat"
        suggestions={[
          "🌦️ Will it rain this week?",
          "🔬 Why are my tomato leaves yellowing?",
          "📅 Plan this month’s sowing schedule",
          "🧪 Optimal soil pH for winter wheat",
          "📈 Mandi wholesale price benchmarks",
        ]}
      />
    </div>
  );
}
