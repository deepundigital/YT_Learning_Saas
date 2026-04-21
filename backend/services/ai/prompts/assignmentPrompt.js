const buildAssignmentPrompt = ({ content, instructions }) => {
  return [
    {
      role: "system",
      content:
        "Act as an expert academic tutor. Solve the assignment step-by-step. Keep answers clear, concise, and well-structured. Use headings, bullet points, and explanations suitable for exams. If multiple questions exist, solve each separately.",
    },
    {
      role: "user",
      content: `Here is the assignment content:\n\n${content}\n\nAdditional Instructions: ${
        instructions || "Provide a detailed solution."
      }`,
    },
  ];
};

module.exports = {
  buildAssignmentPrompt,
};
