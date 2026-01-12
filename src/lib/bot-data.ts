
export const greetingKeywords = ['hi', 'hello', 'hey', 'greetings', 'sup', 'yo', 'morning', 'evening', 'afternoon', 'namaste'];

export const botResponses = [
    "Peace be with you.",
    "The divine light shines within you.",
    "May your heart find clarity today.",
    "In stillness, we find the answers.",
    "You are exactly where you need to be.",
    "Let go of what you cannot control.",
    "The universe flows through you.",
    "Trust the journey.",
    "Breathe deeply and feel the presence.",
    "Every moment is a new beginning.",
    "Kindness is the language of the soul.",
    "Listen to the silence; it speaks.",
    "Your path is illuminated by your faith.",
    "Gratitude unlocks the fullness of life.",
    "You are a vessel of light.",
    "Peace is a choice we make.",
    "Walk gently upon this earth.",
    "The divine is not far from you.",
    "Seek wisdom, and you shall find it.",
    "Let your actions reflect your spirit.",
    "Your soul knows the way.",
    "Embrace the mystery of life.",
    "Love is the highest frequency.",
    "Forgiveness sets you free.",
    "Be a lamp unto yourself.",
    "The present moment is a gift.",
    "Connect with the infinite energy.",
    "Your potential is limitless.",
    "Find joy in the simple things.",
    "Radiate love to all beings."
];

export const morningGreetings = [
    "A blessed morning to you.",
    "May your day be filled with light.",
    "Rise and shine with the divine.",
    "Good morning! A new day of grace.",
    "Let the morning sun warm your soul.",
    "Start this day with a grateful heart.",
    "Morning peace be upon you.",
    "Awaken to the beauty of creation.",
    "May this morning bring you clarity.",
    "Sending you morning blessings.",
    "The dawn breaks, and hope returns.",
    "Embrace the fresh energy of the morning.",
    "Good morning. Walk in faith today.",
    "Let your light shine this morning.",
    "A peaceful start to your day.",
    "Morning! May wisdom guide you.",
    "The world awaits your light.",
    "Greet the morning with a smile.",
    "May your morning be as beautiful as your spirit.",
    "Rise with purpose and joy.",
    "Good morning. You are loved.",
    "Let the morning dew remind you of freshness.",
    "A glorious morning to you, seeker.",
    "May your coffee be warm and your heart warmer.",
    "Morning! Breathe in the new day.",
    "The sun rises for you today.",
    "Step into the morning with courage.",
    "Good morning. Be a blessing today.",
    "May calmness be your companion this morning.",
    "Rise up to meet your higher self.",
    "Morning! The divine greets you.",
    "Let go of yesterday; today is new.",
    "Good morning. Shine bright.",
    "A harmonious morning to you.",
    "May clarity find you early today.",
    "Morning joy to you.",
    "Wake up and feel the connection.",
    "Good morning. Trust the process.",
    "The morning is a canvas; paint it with love.",
    "May your morning be productive and peaceful.",
    "Sending positive morning vibes.",
    "Good morning. Listen to your intuition.",
    "A serene morning to you.",
    "May your path be clear this morning.",
    "Morning! Remember your divinity.",
    "Let the morning silence heal you.",
    "Good morning. You are a miracle.",
    "Rise and align with the universe.",
    "May your morning be full of little miracles.",
    "Good morning. Peace.",
    "Welcome to a new dawn."
];

export const afternoonGreetings = [
    "Good afternoon. Keep your peace.",
    "May your afternoon be productive.",
    "Take a breath this afternoon.",
    "Good afternoon! Halfway through beautifully.",
    "Let the afternoon light recharge you.",
    "Blessings for your afternoon.",
    "Stay centered this afternoon.",
    "Good afternoon. Carry the light.",
    "May your lunch nourish your soul.",
    "Afternoon greetings to you.",
    "Find a moment of stillness this afternoon.",
    "Good afternoon. You are doing great.",
    "Keep shining through the afternoon.",
    "May your afternoon be stress-free.",
    "Afternoon peace.",
    "Good afternoon. Stay connected.",
    "Let wisdom guide your afternoon.",
    "Enjoy the rhythm of the afternoon.",
    "Good afternoon. Be present.",
    "Sending afternoon strength."
];

export const eveningGreetings = [
    "Good evening. Rest in peace.",
    "May your evening be tranquil.",
    "Reflect on the day with gratitude.",
    "Good evening! Unwind and let go.",
    "Let the evening stars guide you.",
    "Blessings for a restful evening.",
    "Peace be with you this evening.",
    "Good evening. You've done enough.",
    "May your evening be filled with love.",
    "Evening greetings. Relax your mind.",
    "The day is done; find your calm.",
    "Good evening. Embrace the quiet.",
    "Let the night bring you comfort.",
    "Good evening. Restore your spirit.",
    "May your evening be a sanctuary.",
    "Evening peace to you.",
    "Good evening. Connect with home.",
    "Let go of the day's burden.",
    "Good evening. Be gentle with yourself.",
    "Sending you evening warmth."
];

export const dailySpecifics: Record<number, string[]> = {
    0: ["Happy Sunday. A day of rest.", "Sunday blessings to you.", "Let this Sunday restore you."], // Sunday
    1: ["Happy Monday. A fresh start.", "Monday motivation: You are capable.", "Welcome the new week."],
    2: ["Happy Tuesday. Keep flowing.", "Tuesday blessings.", "Stay strong this Tuesday."],
    3: ["Happy Wednesday. Balance is key.", "Midweek peace to you.", "Wednesday wisdom."],
    4: ["Happy Thursday. You're almost there.", "Thursday light.", "Stay focused this Thursday."],
    5: ["Happy Friday. Joy is approaching.", "Friday blessings.", "Celebrate your week."],
    6: ["Happy Saturday. Enjoy the moment.", "Saturday peace.", "Weekend joy to you."]
};

export function getBotGreeting(): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday

    let timeGreetings = morningGreetings;
    if (hour >= 12 && hour < 17) timeGreetings = afternoonGreetings;
    else if (hour >= 17) timeGreetings = eveningGreetings;

    const randomTimeGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];

    // 30% chance to append a day-specific greeting
    if (Math.random() < 0.3) {
        const dayGreetings = dailySpecifics[day];
        const randomDayGreeting = dayGreetings[Math.floor(Math.random() * dayGreetings.length)];
        return `${randomDayGreeting} ${randomTimeGreeting}`;
    }

    return randomTimeGreeting;
}

export function getBotResponse(userText: string): string | null {
    const lower = userText.toLowerCase();

    // Check if it's a greeting
    if (greetingKeywords.some(k => lower.includes(k))) {
        return botResponses[Math.floor(Math.random() * botResponses.length)];
    }

    // Default "mindful" response if it seems like a question or statement (simple heuristic)
    // For now, we only respond to explicit greetings to avoid being annoying, 
    // or we can add a small chance to respond to generic text with wisdom.
    if (Math.random() < 0.1) { // 10% chance to respond to random things with wisdom
        return botResponses[Math.floor(Math.random() * botResponses.length)];
    }

    return null;
}
