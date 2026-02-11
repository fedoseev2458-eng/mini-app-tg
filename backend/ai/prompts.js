function getRoomPrompt(roomType, styleDesc, budgetDesc, userText) {
  const userPart = userText && userText.trim() ? ` Client wishes: ${userText}.` : "";
  return (
    `Transform this room into a ${styleDesc} style ${roomType}. ` +
    `Budget level: ${budgetDesc}.${userPart} ` +
    "Maintain the same camera angle and room structure. " +
    "Replace furniture, change colors, update materials and decor to match the new style. " +
    "Photorealistic interior design, natural lighting, professional photography quality."
  ).trim();
}

function getApartmentPrompt(userPreferences) {
  return (
    "Photorealistic interior photography. Professional interior design visualization. " +
    "Real materials, natural lighting, realistic furniture. " +
    `Client preferences: ${userPreferences}. `
  ).trim();
}

function getApartmentViewPrompts(userPreferences) {
  const base = getApartmentPrompt(userPreferences);
  return [
    `Generate a photorealistic interior photo: living room and kitchen. ${base} High-end interior photography, natural daylight.`,
    `Generate a photorealistic interior photo: bedroom(s). ${base} Cozy, professional photo, soft lighting.`,
    `Generate a photorealistic interior photo: all bathrooms and toilets (sanitary zones). ${base} Clean, modern, realistic materials.`,
    `Generate a photorealistic interior photo: corridor, entrance, hallway. ${base} Welcoming space, realistic lighting.`,
    `Generate a photorealistic interior photo: additional room (dining, office or second bedroom). ${base} Professional interior, natural lighting.`,
  ];
}

function getVisionAnalysisPrompt() {
  return (
    "Describe this room photo for redesign. Format: " +
    "CAMERA: viewpoint, height, angle. " +
    "FURNITURE: each piece, position, orientation. " +
    "WINDOWS: positions, sizes. LIGHT: sources and positions. ROOM: shape, ceiling. " +
    "Write in English. Be concise."
  ).trim();
}

function getPlanAnalysisPrompt() {
  return (
    "Describe this floor plan in detail: list EVERY space. " +
    "For each: room name (living room, bedroom 1, bedroom 2, kitchen, bathroom, toilet, corridor, entrance, etc.), " +
    "approximate size and position, connections to other rooms, windows and doors. " +
    "Write in English. Be exhaustive — no room, corridor, or bathroom may be omitted."
  ).trim();
}

module.exports = {
  getRoomPrompt,
  getApartmentPrompt,
  getApartmentViewPrompts,
  getVisionAnalysisPrompt,
  getPlanAnalysisPrompt,
};
