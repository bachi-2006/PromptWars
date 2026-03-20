/**
 * Service to handle Gemini Multimodal AI extraction.
 * In a real app, this would call the Google AI SDK with an image/video prompt.
 */
export const extractAccidentDetails = async (mediaBlob) => {
  console.log("Analyzing media with Gemini...", mediaBlob);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  return {
    severity: "CRITICAL",
    vehicles: [
      { type: "SUV", color: "Black", plate: "ABC-1234", damage: "Front-end heavy" },
      { type: "Sedan", color: "Silver", plate: "XYZ-9876", damage: "T-bone side impact" }
    ],
    injuries: [
      { type: "Unresponsive individual", location: "Driver's seat Vehicle B" },
      { type: "Visible laceration", location: "Passenger Vehicle A" }
    ],
    urgencyLevel: 5, // 1-5 scale
    summary: "Two-vehicle high-impact collision. Immediate medical intervention required for trapped driver in Vehicle B."
  };
};
