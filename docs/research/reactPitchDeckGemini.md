import React, { useState } from 'react';

export default function ClientExplorer() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const callGeminiAPI = async (promptText) => {
    const apiKey = ""; // Key injected at runtime
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const systemPrompt = `You are a charming, highly persuasive digital assistant acting as a 'trial lawyer' on behalf of software engineer John Richmond. You are presenting to the family leadership of Rainbow Jeans: the Owner, the Son (ops/web), and the Daughter (payroll). 

    Your goal is to gently but firmly prove that John's custom scheduling app ($2,000 setup, $497/month) is infinitely better than cheap generic alternatives, and is the most lucrative operational upgrade they will make this year.
    
    FACTS IN EVIDENCE (Use these to crush objections):
    1. THE WAGE LEAK: Staff make $18/hr. With 34 staff on legacy punch systems (like Counterpoint), 5 minutes of time-rounding per shift equals ~$1,500/month in lost payroll. John's digital clock-in stops this. The $497/mo fee pays for itself 3x over.
    2. THE ADP HANDOFF: The app generates perfectly formatted handoff documents for ADP. This eliminates manual data entry and transcription errors for the Daughter.
    3. THE FLOOR ROI: By digitizing her exact logic and automating shift swaps, Sarvi reclaims up to 20% of her week to focus on driving high-end retail sales, rather than managing paper.
    4. THE "CHEAP APP" COMPROMISE: Apps like Homebase or When I Work are $40/mo because they are built for 5-person coffee shops. They are rigid. Cheap software forces the business to change to fit the app. John's custom app changes to fit Sarvi's unique business logic.
    5. THE ADP SCHEDULING TRAP: ADP's native scheduling modules are clunky, visually dated, and hated by young retail staff. John's app offers a modern, premium mobile experience staff will actually use, while keeping the backend data perfect for ADP.
    6. THE SUPPORT ADVANTAGE: If a cheap app breaks on Black Friday, Rainbow Jeans gets an offshore support ticket. For $497/mo, they get a direct line to John, their dedicated developer.
    
    TONE: Respectful, charismatic, analytical, and relentlessly focused on financial ROI. Acknowledge what cheap apps do well, but dismantle them on scale and flexibility. Keep responses to 1-2 punchy, persuasive paragraphs.`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const retries = 5;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      } catch (error) {
        if (i === retries - 1) return `Error connecting to Gemini API: ${error.message}`;
        await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleAsk = async (overrideQuestion = null) => {
    const queryToUse = overrideQuestion || question;
    if (!queryToUse.trim()) return;
    
    if (overrideQuestion) setQuestion(overrideQuestion);
    
    setLoading(true);
    setAiResponse('');
    
    const prompt = `The Rainbow Jeans leadership team asks: "${queryToUse}". Please provide a persuasive, professional response based on the facts in evidence.`;
    const responseText = await callGeminiAPI(prompt);
    
    setAiResponse(responseText);
    setLoading(false);
  };

  const quickQuestions = [
    "Why not just use a $40 app like Homebase?",
    "How does this exactly help with ADP payroll?",
    "Why is the setup fee $2,000?",
    "What if the staff hates using it?"
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0B1120] text-slate-100 p-8 md:p-12 overflow-y-auto font-sans">
      
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">
          The Financial Case for Custom
        </h2>
        <p className="text-slate-400 mt-3 text-lg max-w-2xl mx-auto">
          Replacing Counterpoint, streamlining ADP, and putting Sarvi back on the floor. Explore the ROI data and ask the assistant any questions.
        </p>
      </div>

      {/* The 90-Day Plan with New Evidence */}
      <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
        <div className="bg-slate-800/40 p-6 rounded-xl border border-emerald-500/20 flex-1 relative shadow-lg">
          <div className="absolute -top-3 -left-3 bg-emerald-500 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">1</div>
          <h3 className="font-bold text-white text-xl mb-2 ml-4">Retire Counterpoint</h3>
          <p className="text-sm text-slate-400 ml-4">Replacing the legacy punch system stops time-rounding. Saving just 5 minutes per shift across 34 staff at $18/hr recovers ~$1,500 monthly.</p>
        </div>
        
        <div className="bg-slate-800/40 p-6 rounded-xl border border-teal-500/20 flex-1 relative shadow-lg">
          <div className="absolute -top-3 -left-3 bg-teal-500 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">2</div>
          <h3 className="font-bold text-white text-xl mb-2 ml-4">Automate ADP</h3>
          <p className="text-sm text-slate-400 ml-4">No more manual data entry. The app generates pristine, ADP-formatted documents every payroll cycle, eliminating transcription errors.</p>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-xl border border-cyan-500/20 flex-1 relative shadow-lg">
          <div className="absolute -top-3 -left-3 bg-cyan-500 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">3</div>
          <h3 className="font-bold text-white text-xl mb-2 ml-4">Custom vs Generic</h3>
          <p className="text-sm text-slate-400 ml-4">Cheap apps force Sarvi to adapt to their rules. We digitize Sarvi's exact logic, providing white-glove support no generic app can match.</p>
        </div>
      </div>

      {/* Client-Facing Interactive Q&A */}
      <div className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-8 shadow-2xl mt-auto max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Ask the Rollout Assistant</h3>
            <p className="text-sm text-slate-400 mt-1">Test the AI's logic on pricing, alternative apps, and payroll integrations.</p>
          </div>
          
          {/* Quick Ask Buttons */}
          <div className="flex flex-wrap gap-2 sm:max-w-xs justify-end">
            {quickQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => handleAsk(q)}
                className="text-xs bg-slate-700 hover:bg-emerald-600 text-slate-200 py-1.5 px-3 rounded-full transition-colors border border-slate-600 hover:border-emerald-500 text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your own question here..."
            className="w-full h-24 bg-slate-900/90 border border-slate-500 rounded-lg p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none text-lg"
          />
          
          <button 
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg self-end disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Analyzing Case...' : 'Ask Question'}
          </button>
        </div>

        {/* Response Area */}
        {(loading || aiResponse) && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            {loading ? (
               <div className="flex items-center text-emerald-400 font-semibold animate-pulse">
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 Reviewing the evidence...
               </div>
            ) : (
              <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-6 rounded-lg border border-emerald-500/30 shadow-inner">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}