
import { NextResponse } from 'next/server';
import { addPost, addAnswer } from '@/lib/community-store';

export async function GET() {
    try {
        // 1. Article: Divine Alignment
        await addPost('admin', 'Divine Admin', 'Divine Alignment: Syncing with Your Higher Purpose', 
            `## What is Divine Alignment?

Divine alignment is the state of being in tune with the flow of the universe and the will of the Divine. It's not just about "getting what you want," but about **wanting what is meant for you**. When you are aligned, life feels less like a struggle and more like a dance.

### Signs You Are Aligned
- **Synchronicities:** You see repeating numbers (11:11, 333) or meaningful coincidences.
- **Inner Peace:** Even in chaos, you feel a core of stability.
- **Flow State:** Opportunities appear effortlessly.

### How to Align
1. **Silence:** Spend 10 minutes daily in silence. God speaks in the pauses.
2. **Surrender:** Stop forcing outcomes. Trust the timing of your life.
3. **Service:** When you help others, you align with the nature of the Divine, which is love.`, 
            { type: 'article', isVerified: true, tags: ['Spirituality', 'Purpose', 'Growth'], coverImage: 'https://images.unsplash.com/photo-1518531933037-9a847dd21292?w=800&q=80' }
        );

        // 2. Article: Spirituality vs Religion
        await addPost('admin', 'Divine Admin', 'Spirituality vs. Religion: A Guide to Mental Wellness', 
            `## Understanding the Difference

In the modern world, many find themselves asking: *Can I be spiritual without being religious?* The answer is a resounding **yes**, and understanding this distinction is key to mental wellness for many.

> "Religion is believing in someone else's experience. Spirituality is having your own experience."

### The Mental Health Benefits
Research shows that spiritual practices—whether religious or secular—can reduce anxiety and depression.
- **Connection:** Feeling connected to something larger reduces isolation.
- **Meaning:** It provides a framework for suffering, making it bearable.
- **Hope:** Faith is a powerful antidote to despair.

### Integration
You don't have to choose. You can find the Divine in a church, in a forest, or in your own breath. The goal is the same: **Union with the Source.**`, 
            { type: 'article', isVerified: true, tags: ['Mental Health', 'Wellness', 'Faith'], coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
        );

        // 3. Question: Anxiety
        const q1 = await addPost('user_123', 'HopeSeeker', 'How can spirituality help with my severe anxiety?', 
            `I've been struggling with panic attacks and constant worry. I feel like I'm losing control. Everyone tells me to "pray," but I don't know how that helps when I can't even breathe. Has anyone found real relief through spiritual practice?`, 
            { type: 'question', tags: ['Anxiety', 'Help'] }
        );
        // Add answer to q1 if possible - logic requires ID, but addPost doesn't return ID in the simplified return. 
        // I'll need to fetch the posts to get IDs or just rely on the user seeing them newly created. 
        // For this simple seed, I'll just create them. If I really want answers, I'd need to modify addPost to return the ref.
        
        // 4. Question: Depression
        await addPost('user_456', 'LostSoul', 'Is God angry with me? Why am I depressed?', 
            `I feel so heavy and dark inside. I was taught that if I'm faithful, I'll be joyful. But I'm not. Does this mean I'm being punished? I feel so abandoned.`, 
            { type: 'question', tags: ['Depression', 'Faith'] }
        );

        // 5. Article: 5 Practices
        await addPost('admin', 'Divine Admin', '5 Spiritual Practices for Instant Inner Peace', 
            `### 1. Breath Prayer
Inhale: *I receive peace.*
Exhale: *I release fear.*
Repeat this for 2 minutes whenever you feel stressed.

### 2. Grounding in Nature
Take off your shoes and walk on grass or soil. The earth's electrons have a healing effect on the nervous system.

### 3. Gratitude Journaling
Write down 3 things you are grateful for every morning. It rewires your brain to scan for the good.

### 4. Digital Detox
Disconnect to reconnect. Your soul cannot speak over the noise of notifications.

### 5. Acts of Kindness
Get out of your own head by helping someone else. It's the fastest cure for self-pity.`, 
            { type: 'article', isVerified: true, tags: ['Practices', 'Peace', 'Tips'], coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80' }
        );

        return NextResponse.json({ success: true, message: 'Content seeded successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
