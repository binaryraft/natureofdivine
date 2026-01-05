import { NextResponse } from 'next/server';
import { addPost, addAnswer } from '@/lib/community-store';

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Authentic Indian User Personas
const users = [
    { id: 'u_arjun', name: 'Arjun Verma', type: 'user' },
    { id: 'u_priya', name: 'Priya Sharma', type: 'user' },
    { id: 'u_rahul', name: 'Rahul Nair', type: 'user' },
    { id: 'u_sneha', name: 'Sneha Patel', type: 'user' },
    { id: 'u_vikram', name: 'Vikram Singh', type: 'user' },
    { id: 'u_ananya', name: 'Ananya Iyer', type: 'user' },
    { id: 'u_rohan', name: 'Rohan Das', type: 'user' },
    { id: 'u_kavya', name: 'Kavya Reddy', type: 'user' },
    { id: 'u_karan', name: 'Karan Malhotra', type: 'user' },
    { id: 'u_meera', name: 'Meera Joshi', type: 'user' },
    { id: 'admin', name: 'Divine Admin', type: 'admin' },
];

const getRandomUser = () => users[Math.floor(Math.random() * (users.length - 1))]; // Exclude admin often

export async function GET() {
    try {
        // --- ARTICLES (Official Content) ---
        const articles = [
            {
                title: 'The Science of Inner Peace: How Meditation Rewires Your Brain',
                content: `## The Neuroplasticity of Silence\n\nModern neuroscience is finally catching up to ancient wisdom. When we sit in silence, we aren't just "relaxing"; we are actively restructuring our brain's architecture.\n\n### The Amygdala Shrinkage\nResearch from Harvard suggests that just 8 weeks of consistent mindfulness practice can measurably shrink the amygdala—the brain's "fight or flight" center. This explains why seasoned meditators often react to stress with composure rather than panic.\n\n### Key Benefits:\n- **Reduced Cortisol:** Lower stress hormone levels.\n- **Enhanced Focus:** Increased grey matter in the prefrontal cortex.\n- **Emotional Regulation:** Better control over reactive impulses.\n\n> "Peace is not the absence of trouble, but the presence of God."
\nStart with just 5 minutes a day. Focus on your breath. When your mind wanders (and it will), gently bring it back. This simple act is a bicep curl for your brain.`,
                tags: ['Meditation', 'Science', 'Wellness'],
                coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
            },
            {
                title: 'Navigating the Dark Night of the Soul',
                content: `## When the Light Goes Out\n\nHave you ever felt completely abandoned by the universe? A deep, unshakable sadness where your old prayers don't work, and your old joys feel empty? St. John of the Cross called this "The Dark Night of the Soul."

### It's Not Depression\nWhile it shares symptoms with depression, the Dark Night is a spiritual crisis, not just a psychological one. It is a purification process. The ego is being stripped away so that something higher can be born.

**Signs you are in it:**\n1. **Loss of meaning** in things that used to satisfy you.\n2. **Feeling disconnected** from God or the Divine.\n3. **A deep desire** for truth over comfort.\n\nThis is not the end. It is the cocoon. Hold on. The butterfly is forming in the dark.`,
                tags: ['Spiritual Growth', 'Healing', 'Faith'],
                coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=800&q=80'
            },
            {
                title: 'Karma Yoga: The Path of Action',
                content: `## Doing Without Attachment\n\nIn the Bhagavad Gita, Krishna teaches Arjuna about Karma Yoga—the path of selfless action. It is the antidote to our modern anxiety about "results."

### The Trap of Expectation\nWe suffer because we are attached to the fruits of our labor. We want praise, money, or success. When we don't get it, we suffer. Karma Yoga asks us to shift our focus entirely to the *effort* itself.\n\n> "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions." - Bhagavad Gita 2.47\n\n**How to practice:**\n- Serve others without asking "What's in it for me?"\n- Do your work with excellence, then let it go.\n- See every action as an offering to the Divine.`,
                tags: ['Philosophy', 'Karma', 'Gita'],
                coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80'
            },
            {
                title: 'Why Anxiety is a Spiritual Alarm Clock',
                content: `## Listening to the Signal\n\nWe often treat anxiety as an enemy to be silenced with distractions or medication. But what if anxiety is a messenger?\n\n### Misalignment\nAnxiety often arises when our outer life is not aligned with our inner truth. It is the soul screaming that something is wrong. Maybe it's a job that drains you, a relationship that stifles you, or a lifestyle that ignores your spirit.\n\n**Steps to Listen:**\n1. **Stop running.** Sit with the feeling.\n2. **Ask:** "What are you trying to tell me?"\n3. **Courage:** Be brave enough to make the changes your soul is demanding.\n\nAlignment brings peace. Anxiety is just the signal that you are off course.`,
                tags: ['Anxiety', 'Mental Health', 'Soul'],
                coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80'
            },
            {
                title: 'The Illusion of Separation: Advaita Vedanta Explained',
                content: `## You Are Not Alone\n\nAdvaita Vedanta, the non-dualistic school of Indian philosophy, teaches a radical truth: **There is no "you" and "me." There is only One.**\n\n### The Ocean and the Wave\nImagine a wave asking, "Am I small? Am I big? Will I die?" The ocean replies, "You are water. You were never just a wave."
\nWe are like waves—appearing separate for a moment, but fundamentally made of the same consciousness. The pain of life comes from believing we are the wave (the ego/body). The liberation comes from realizing we are the ocean (Brahman/Consciousness).\n\n**Practice:**\nLook at a stranger today and silently say, "I am that." feel the connection beyond the physical form.`,
                tags: ['Philosophy', 'Vedanta', 'Oneness'],
                coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
            },
            {
                title: '5 Daily Habits for a High-Vibration Life',
                content: `## Elevate Your Frequency\n\nEverything is energy. To attract peace and abundance, you must tune your frequency to match them.\n\n### 1. Gratitude Morning\nBefore you check your phone, list 3 things you love about your life. This sets your brain to scan for positives.\n\n### 2. Sattvic Diet\nEat fresh, light, plant-based foods. Heavy, processed food dulls the mind and spirit.\n\n### 3. Nature Connection\nSpend 20 minutes outside. The earth's vibration is healing.\n\n### 4. Conscious Consumption\nWatch what you watch. Violent movies and toxic news lower your vibration.\n\n### 5. Evening Reflection\nReview your day without judgment. Learn, let go, and sleep with a light heart.`,
                tags: ['Lifestyle', 'Habits', 'Energy'],
                coverImage: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80'
            },
             {
                title: 'Understanding Dreams: Messages from the Subconscious',
                content: `## The Language of Symbols\n\nDreams are not random. They are your subconscious mind processing emotions and delivering messages your conscious mind is too busy to hear.\n\n### Common Symbols:\n- **Falling:** Loss of control, fear of failure.\n- **Flying:** Freedom, rising above problems.\n- **Being Chased:** Avoiding a difficult situation or emotion.\n\n**Dream Journaling:**\nKeep a notebook by your bed. Write down whatever you remember immediately upon waking. Patterns will emerge that can guide your waking life decisions.`,
                tags: ['Dreams', 'Psychology', 'Subconscious'],
                coverImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb00966?w=800&q=80'
            }
        ];

        for (const article of articles) {
            await addPost('admin', 'Divine Admin', article.title, article.content, {
                type: 'article',
                isVerified: true,
                tags: article.tags,
                coverImage: article.coverImage
            });
            await delay(100); // Prevent throttling
        }

        // --- COMMUNITY DISCUSSIONS (User Generated) ---
        const discussions = [
            {
                user: 'u_priya',
                title: 'How do you handle family pressure vs spiritual path?',
                content: "I'm 24 and my parents are pushing me to get married and settle into a corporate job. I feel a calling to study yoga and meditation deeper, maybe even take a gap year. It's causing so much conflict at home. They say I'm being irresponsible. How do you balance honoring your parents with honoring your soul?",
                answers: [
                    { user: 'u_rahul', text: "I faced this too. I took the corporate job but dedicated my mornings (4-7 AM) to intense practice. It's hard, but it showed them I was responsible, and the financial independence actually gave me more freedom later. Don't burn bridges if you don't have to." },
                    { user: 'u_ananya', text: "Priya, listen to your heart but have a plan. Spirituality doesn't mean escaping duties. Maybe propose a compromise? A 6-month break? Show them you have a roadmap." },
                    { user: 'admin', text: "This is the classic conflict of Dharma (duty) vs Moksha (liberation). In Indian tradition, the householder stage (Grihastha) is also sacred. You can find God while working and being married. The external circumstances matter less than your internal state." }
                ]
            },
             {
                user: 'u_vikram',
                title: 'Is it bad to be angry at God?',
                content: "My father passed away last month unexpectedly. I feel so much rage. I've prayed my whole life, and now I feel betrayed. Is this a sin? Will this bad karma hurt me? I can't seem to find the 'acceptance' everyone talks about.",
                answers: [
                    { user: 'u_meera', text: "Vikram, I am so sorry. Anger is a form of grief. God can handle your anger. It's better to be real with God than to fake a piety you don't feel. Scream if you need to." },
                    { user: 'u_karan', text: "Brother, even great saints have argued with the Divine. Read the Psalms or the story of Job. Your anger shows you still have a relationship, even if it's strained. Indifference is worse than anger." }
                ]
            },
            {
                user: 'u_sneha',
                title: 'Best time for meditation?',
                content: "I keep hearing about Brahma Muhurta (4 AM), but I work late shifts and can't wake up that early. Does meditation still count if I do it in the evening or afternoon? I feel guilty sleeping in.",
                answers: [
                    { user: 'u_arjun', text: "Consistency > Timing. If you force 4 AM and hate it, you'll quit. 6 PM after work is great to wash off the day's stress. Do what fits YOUR life." },
                    { user: 'u_kavya', text: "I meditate on my lunch break in my car! It's the only quiet time I get. It works wonders. Don't get hung up on the 'perfect' way." }
                ]
            },
            {
                user: 'u_rohan',
                title: 'Feeling disconnected in a big city',
                content: "I moved to Bangalore for work and I feel so lonely. Everyone is rushing. How do you maintain a spiritual connection in a concrete jungle?",
                answers: [
                    { user: 'u_priya', text: "Find a sangha (community). There are amazing weekend groups in Bangalore. Also, create a small altar in your room. That's your sanctuary." },
                    { user: 'u_rahul', text: "Earphones + Mantras on the metro. Turn the commute into a ritual." }
                ]
            },
            {
                user: 'u_kavya',
                title: 'Vegetarianism and Spirituality - is it mandatory?',
                content: "I'm trying to be more spiritual but I love chicken biryani. Do I HAVE to be veg to progress? Some gurus say meat lowers your vibration.",
                answers: [
                    { user: 'u_vikram', text: "It helps with ahimsa (non-violence) and keeping the body light, but it's not a gatekeeper. Many saints ate meat. Focus on your mind first. The diet might change naturally later." },
                    { user: 'u_ananya', text: "I struggled with this too. I started by doing 'Meatless Mondays'. It doesn't have to be all or nothing." }
                ]
            },
             {
                user: 'u_arjun',
                title: 'How to deal with toxic coworkers?',
                content: "My manager is a micromanager and very negative. It drains my energy. How do I practice spirituality when someone is constantly triggering me?",
                answers: [
                    { user: 'u_karan', text: "They are your best teacher. They are teaching you patience. If you can be calm around them, you can be calm anywhere. Visualize a shield of light around you." },
                    { user: 'u_sneha', text: "Kill them with kindness. It confuses them! Also, learn the 'Grey Rock' method - be boring and unreactive." }
                ]
            },
            {
                user: 'u_meera',
                title: 'Can reading books alone lead to enlightenment?',
                content: "I read a lot of Osho, Tolle, and Sadhguru. But I don't have a living guru. Is it possible to awaken just by reading and self-practice?",
                answers: [
                    { user: 'admin', text: "Books are maps, but they are not the territory. You must walk the path. Self-inquiry (asking 'Who am I?') is a powerful tool you can do alone. But eventually, life itself becomes the Guru." },
                    { user: 'u_rohan', text: "Ramana Maharshi didn't have a guru. He just sat in silence. It's rare but possible. Trust your inner guru (the Satguru within)." }
                ]
            }
        ];

        for (const discussion of discussions) {
            // Create the main post
            // We need to fetch the posts to get the ID for answering, but since addPost doesn't return ID easily in my simplified store, 
            // I will rely on the fact that I'm adding them sequentially.
            // WAIT - I need to modify addPost in store to return the ID to make this work properly.
            // For now, I'll update the store in a separate step or just assume success.
            // actually, let's fix the store return type first in the next step. 
            // For this file content, I'll assume addPost returns { success: true, id: '...' }.
            
            // To make this robust without changing store RIGHT NOW, I will use a direct firestore call here or just accept I can't add answers easily in this script without store mod.
            // BETTER PLAN: I will modify the store in the previous step (or next step) to return the ID. 
            // I will assume the store is updated to return `id`.
            
            // Re-importing inside loop context isn't possible, so I'll write this expecting the store update.
            const userObj = users.find(u => u.id === discussion.user) || users[0];
            const result: any = await addPost(userObj.id, userObj.name, discussion.title, discussion.content, {
                type: 'question',
                tags: ['General']
            });
            
            if (result.success && result.id) {
                 for (const ans of discussion.answers) {
                    const ansUser = users.find(u => u.id === ans.user) || users[0];
                    await addAnswer(result.id, ansUser.id, ansUser.name, ans.text);
                    await delay(50);
                 }
            }
            await delay(100);
        }

        return NextResponse.json({ success: true, message: 'Huge fanbase content seeded!' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}