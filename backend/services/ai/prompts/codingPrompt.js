function buildCodingPrompt({ platform, stats }) {
  const statsString = JSON.stringify(stats, null, 2);
  
  return [
    {
      role: "system",
      content: "You are an AI coding mentor. Your goal is to analyze a student's coding profile and provide encouraging, actionable, and personalized feedback."
    },
    {
      role: "user",
      content: `
Analyze this user's coding stats on ${platform}:

${statsString}

Provide a short, motivating feedback (2-3 sentences). 
Focus on their progress, difficulty distribution (if available), or consistency.
Keep it student-friendly and encouraging.
`.trim()
    }
  ];
}

module.exports = {
  buildCodingPrompt
};
