
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  description: string;
  category: 'Spiritual' | 'Self-Help' | 'Philosophy' | 'Productivity' | 'Finance' | 'Psychology' | 'Politics' | 'Novels' | 'Fantasy' | 'Sci-Fi' | 'History' | 'Biography' | 'Business';
  isBestSeller?: boolean;
  isLatest?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  bookCount: number;
  price: number;
  pricePerBook: number;
  coverImage: string;
  books: string[];
  description: string;
}

export const books: Book[] = [
  // ── OWN TITLE ─────────────────────────────────────────────────────────────
  {
    id: 'nature-of-the-divine',
    title: 'Nature of the Divine',
    author: 'Alfas B',
    price: 199,
    coverImage: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png',
    description: 'A revolutionary blueprint for the modern soul—a bridge between the unyielding logic of the mind and the infinite depth of Divine Consciousness.',
    category: 'Spiritual',
    isBestSeller: true,
    isLatest: true,
  },

  // ── SPIRITUAL & PSYCHOLOGY (Current Best Sellers) ──────────────────────────
  { id: 'the-power-of-now', title: 'The Power of Now', author: 'Eckhart Tolle', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg', description: 'A guide to spiritual enlightenment.', category: 'Spiritual', isBestSeller: true },
  { id: 'untethered-soul', title: 'The Untethered Soul', author: 'Michael A. Singer', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781572244375-L.jpg', description: 'Beyond yourself to inner freedom.', category: 'Spiritual', isBestSeller: true },
  { id: 'mans-search-for-meaning', title: "Man's Search for Meaning", author: 'Viktor E. Frankl', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg', description: 'Finding meaning in life.', category: 'Spiritual', isBestSeller: true },
  { id: 'the-four-agreements', title: 'The Four Agreements', author: 'Don Miguel Ruiz', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg', description: 'Ancient Toltec wisdom.', category: 'Spiritual' },
  { id: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', description: 'Proven way to build good habits.', category: 'Self-Help', isBestSeller: true },
  { id: 'ikigai', title: 'Ikigai', author: 'Hector Garcia', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg', description: 'The Japanese secret to a long life.', category: 'Philosophy', isBestSeller: true },
  { id: 'subtle-art', title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg', description: 'A counterintuitive approach.', category: 'Self-Help', isBestSeller: true },
  { id: 'think-like-a-monk', title: 'Think Like a Monk', author: 'Jay Shetty', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781982134488-L.jpg', description: 'Ancient wisdom for modern life.', category: 'Spiritual', isBestSeller: true },
  { id: 'psychology-of-money', title: 'The Psychology of Money', author: 'Morgan Housel', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg', description: 'Lessons on wealth and greed.', category: 'Finance', isBestSeller: true },
  { id: 'sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg', description: 'A brief history of humankind.', category: 'Philosophy', isBestSeller: true },

  // ── NOVELS & LITERARY FICTION ──────────────────────────────────────────────
  { id: '1984-orwell', title: '1984', author: 'George Orwell', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', description: 'The definitive dystopian novel.', category: 'Novels', isBestSeller: true },
  { id: 'brave-new-world', title: 'Brave New World', author: 'Aldous Huxley', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg', description: 'A vision of the future.', category: 'Novels' },
  { id: 'the-great-gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', description: 'The American dream.', category: 'Novels' },
  { id: 'to-kill-a-mockingbird', title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg', description: 'A classic of American literature.', category: 'Novels', isBestSeller: true },
  { id: 'the-alchemist-coelho', title: 'The Alchemist', author: 'Paulo Coelho', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', description: 'Follow your heart.', category: 'Philosophy', isBestSeller: true },
  { id: 'catcher-in-the-rye', title: 'The Catcher in the Rye', author: 'J.D. Salinger', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg', description: 'Teenage angst and alienation.', category: 'Novels' },
  { id: 'pride-and-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', description: 'Manners and marriage.', category: 'Novels' },
  { id: 'the-little-prince', title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg', description: 'A poetic tale for all ages.', category: 'Philosophy' },
  { id: 'life-of-pi', title: 'Life of Pi', author: 'Yann Martel', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780156027328-L.jpg', description: 'Survival and storytelling.', category: 'Novels' },
  { id: 'kite-runner', title: 'The Kite Runner', author: 'Khaled Hosseini', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781594480003-L.jpg', description: 'Friendship and redemption.', category: 'Novels' },

  // ── FANTASY ────────────────────────────────────────────────────────────────
  { id: 'the-hobbit', title: 'The Hobbit', author: 'J.R.R. Tolkien', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg', description: 'There and back again.', category: 'Fantasy', isBestSeller: true },
  { id: 'fellowship-of-ring', title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780547928210-L.jpg', description: 'The epic journey begins.', category: 'Fantasy' },
  { id: 'harry-potter-1', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg', description: 'The boy who lived.', category: 'Fantasy', isBestSeller: true },
  { id: 'game-of-thrones', title: 'A Game of Thrones', author: 'George R.R. Martin', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553103540-L.jpg', description: 'Winter is coming.', category: 'Fantasy', isBestSeller: true },
  { id: 'the-name-of-the-wind', title: 'The Name of the Wind', author: 'Patrick Rothfuss', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg', description: 'A legend in his own time.', category: 'Fantasy' },
  { id: 'american-gods', title: 'American Gods', author: 'Neil Gaiman', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780380789030-L.jpg', description: 'Old gods vs new.', category: 'Fantasy' },
  { id: 'circe-miller', title: 'Circe', author: 'Madeline Miller', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg', description: 'The witch of Aiaia.', category: 'Fantasy' },
  { id: 'good-omens', title: 'Good Omens', author: 'Terry Pratchett & Neil Gaiman', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780060853969-L.jpg', description: 'The apocalypse is coming.', category: 'Fantasy' },

  // ── POLITICS & HISTORY ─────────────────────────────────────────────────────
  { id: 'the-prince-machiavelli', title: 'The Prince', author: 'Niccolò Machiavelli', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140449150-L.jpg', description: 'Power and statecraft.', category: 'Politics' },
  { id: 'on-liberty-mill', title: 'On Liberty', author: 'John Stuart Mill', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140432077-L.jpg', description: 'The limits of authority.', category: 'Politics' },
  { id: 'the-republic-plato', title: 'The Republic', author: 'Plato', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140449143-L.jpg', description: 'Justice and the ideal state.', category: 'Politics' },
  { id: 'wealth-of-nations', title: 'The Wealth of Nations', author: 'Adam Smith', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140432084-L.jpg', description: 'The foundation of modern economics.', category: 'Politics' },
  { id: 'communist-manifesto', title: 'The Communist Manifesto', author: 'Marx & Engels', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140447576-L.jpg', description: 'Workers of the world, unite.', category: 'Politics' },
  { id: 'the-guns-of-august', title: 'The Guns of August', author: 'Barbara Tuchman', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780345386236-L.jpg', description: 'The outbreak of WWI.', category: 'History' },
  { id: 'team-of-rivals', title: 'Team of Rivals', author: 'Doris Kearns Goodwin', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780684824901-L.jpg', description: 'Lincolns political genius.', category: 'History', isBestSeller: true },
  { id: 'the-splendid-and-vile', title: 'The Splendid and the Vile', author: 'Erik Larson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780385348713-L.jpg', description: 'Churchill during the Blitz.', category: 'History', isLatest: true },

  // ── SCI-FI ────────────────────────────────────────────────────────────────
  { id: 'dune-herbert', title: 'Dune', author: 'Frank Herbert', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg', description: 'The desert planet.', category: 'Sci-Fi', isBestSeller: true },
  { id: 'foundation-asimov', title: 'Foundation', author: 'Isaac Asimov', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg', description: 'The fall of the galactic empire.', category: 'Sci-Fi' },
  { id: 'neuromancer-gibson', title: 'Neuromancer', author: 'William Gibson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg', description: 'The birth of cyberpunk.', category: 'Sci-Fi' },
  { id: 'the-martian-weir', title: 'The Martian', author: 'Andy Weir', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg', description: 'Science vs survival.', category: 'Sci-Fi', isBestSeller: true },
  { id: 'hitchhikers-guide', title: "The Hitchhiker's Guide to the Galaxy", author: 'Douglas Adams', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg', description: "Don't panic.", category: 'Sci-Fi' },

  // ── BIOGRAPHY & BUSINESS ───────────────────────────────────────────────────
  { id: 'steve-jobs-isaacson', title: 'Steve Jobs', author: 'Walter Isaacson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg', description: 'The life of a visionary.', category: 'Biography', isBestSeller: true },
  { id: 'shoe-dog-knight', title: 'Shoe Dog', author: 'Phil Knight', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781501135910-L.jpg', description: 'The story of Nike.', category: 'Business', isBestSeller: true },
  { id: 'grinding-it-out', title: 'Grinding It Out', author: 'Ray Kroc', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780312929879-L.jpg', description: 'The making of McDonald\'s.', category: 'Business' },
  { id: 'bad-blood-carreyrou', title: 'Bad Blood', author: 'John Carreyrou', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781524731656-L.jpg', description: 'Secrets and lies in a Silicon Valley startup.', category: 'Business', isBestSeller: true },
  { id: 'elon-musk-vance', title: 'Elon Musk', author: 'Ashlee Vance', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780062301239-L.jpg', description: 'Tesla, SpaceX, and the quest for a fantastic future.', category: 'Biography' },

  // ── (Batch 2: Generating more to reach 100+) ───────────────────────────────
  // History
  { id: 'guns-germs-steel', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780393317558-L.jpg', description: 'The fates of human societies.', category: 'History' },
  { id: 'a-brief-history-of-time', title: 'A Brief History of Time', author: 'Stephen Hawking', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg', description: 'From the big bang to black holes.', category: 'Philosophy' },
  
  // Novels (Classic & Modern)
  { id: 'the-road-mccarthy', title: 'The Road', author: 'Cormac McCarthy', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg', description: 'A father and son walking.', category: 'Novels' },
  { id: 'norwegian-wood', title: 'Norwegian Wood', author: 'Haruki Murakami', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780375704079-L.jpg', description: 'Nostalgic love story.', category: 'Novels' },
  { id: 'beloved-morrison', title: 'Beloved', author: 'Toni Morrison', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781400033416-L.jpg', description: 'The ghost of a child.', category: 'Novels' },
  { id: 'the-shadow-of-the-wind', title: 'The Shadow of the Wind', author: 'Carlos Ruiz Zafón', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780143034902-L.jpg', description: 'The Cemetery of Forgotten Books.', category: 'Novels' },
  
  // Politics
  { id: 'the-road-to-serfdom', title: 'The Road to Serfdom', author: 'F.A. Hayek', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780226320557-L.jpg', description: 'The dangers of tyranny.', category: 'Politics' },
  { id: 'the-origins-of-totalitarianism', title: 'The Origins of Totalitarianism', author: 'Hannah Arendt', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780156701532-L.jpg', description: 'The rise of Nazi and Soviet regimes.', category: 'Politics' },

  // Fantasy
  { id: 'the-way-of-kings', title: 'The Way of Kings', author: 'Brandon Sanderson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780765326355-L.jpg', description: 'The Stormlight Archive begins.', category: 'Fantasy' },
  { id: 'mistborn-sanderson', title: 'Mistborn', author: 'Brandon Sanderson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780765311788-L.jpg', description: 'The Final Empire.', category: 'Fantasy' },
  
  // (Adding a few more to reach a solid variety)
  { id: 'slaughterhouse-five', title: 'Slaughterhouse-Five', author: 'Kurt Vonnegut', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780385333849-L.jpg', description: 'The children\'s crusade.', category: 'Novels' },
  { id: 'catch-22-heller', title: 'Catch-22', author: 'Joseph Heller', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780684833392-L.jpg', description: 'A satirical war novel.', category: 'Novels' },
  { id: 'the-book-thief', title: 'The Book Thief', author: 'Markus Zusak', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780375831003-L.jpg', description: 'Narrated by Death.', category: 'Novels' },
  { id: 'never-let-me-go', title: 'Never Let Me Go', author: 'Kazuo Ishiguro', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781400078776-L.jpg', description: 'A haunting tale of clones.', category: 'Sci-Fi' },
  { id: 'the-left-hand-of-darkness', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg', description: 'A world of no gender.', category: 'Sci-Fi' },
  { id: 'enders-game', title: "Ender's Game", author: 'Orson Scott Card', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780812550702-L.jpg', description: 'The mind of a child general.', category: 'Sci-Fi' },
  { id: 'frankenstein-shelley', title: 'Frankenstein', author: 'Mary Shelley', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780141439471-L.jpg', description: 'The modern Prometheus.', category: 'Sci-Fi' },
  { id: 'dracula-stoker', title: 'Dracula', author: 'Bram Stoker', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780141439846-L.jpg', description: 'The count from Transylvania.', category: 'Novels' },
  { id: 'the-odyssey-homer', title: 'The Odyssey', author: 'Homer', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140268867-L.jpg', description: 'The long journey home.', category: 'Philosophy' },
  { id: 'iliad-homer', title: 'The Iliad', author: 'Homer', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140275360-L.jpg', description: 'The siege of Troy.', category: 'Philosophy' },
  { id: 'the-art-of-war', title: 'The Art of War', author: 'Sun Tzu', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780195014761-L.jpg', description: 'Ancient military strategy.', category: 'Philosophy', isBestSeller: true },
  { id: 'tao-te-ching', title: 'Tao Te Ching', author: 'Lao Tzu', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140441314-L.jpg', description: 'The way and its power.', category: 'Spiritual' },
  { id: 'the-prophet-gibran', title: 'The Prophet', author: 'Kahlil Gibran', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780394404288-L.jpg', description: 'Poetic essays on life.', category: 'Spiritual' },
  { id: 'sidhartha-hesse', title: 'Siddhartha', author: 'Hermann Hesse', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780141181233-L.jpg', description: 'The journey to enlightenment.', category: 'Spiritual' },
  
  // -- BATCH 3 (Reaching 100+) --
  // Politics
  { id: 'iron-curtain-applebaum', title: 'Iron Curtain', author: 'Anne Applebaum', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781400045198-L.jpg', description: 'The crushing of Eastern Europe.', category: 'Politics' },
  { id: 'why-nations-fail', title: 'Why Nations Fail', author: 'Acemoglu & Robinson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780307719218-L.jpg', description: 'Origins of power, prosperity, and poverty.', category: 'Politics', isBestSeller: true },
  { id: 'on-tyranny-snyder', title: 'On Tyranny', author: 'Timothy Snyder', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780804190114-L.jpg', description: 'Twenty lessons from the twentieth century.', category: 'Politics' },
  { id: 'the-dictators-handbook', title: "The Dictator's Handbook", author: 'Mesquita & Smith', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781610390446-L.jpg', description: 'Why bad behavior is almost always good politics.', category: 'Politics' },
  
  // Novels
  { id: 'anna-karenina', title: 'Anna Karenina', author: 'Leo Tolstoy', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780143035008-L.jpg', description: 'Happy families are all alike.', category: 'Novels' },
  { id: 'crime-and-punishment', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg', description: 'Guilt and redemption.', category: 'Novels', isBestSeller: true },
  { id: 'the-brothers-karamazov', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780374528379-L.jpg', description: 'A theological drama of passion.', category: 'Novels' },
  { id: 'the-stranger-camus', title: 'The Stranger', author: 'Albert Camus', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780679720201-L.jpg', description: 'Absurdity and alienation.', category: 'Philosophy' },
  { id: 'war-and-peace', title: 'War and Peace', author: 'Leo Tolstoy', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780140447934-L.jpg', description: 'The napoleonic era in Russia.', category: 'Novels' },
  
  // Fantasy
  { id: 'the-blade-itself', title: 'The Blade Itself', author: 'Joe Abercrombie', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781591025337-L.jpg', description: 'The First Law begins.', category: 'Fantasy' },
  { id: 'lies-of-locke-lamora', title: 'The Lies of Locke Lamora', author: 'Scott Lynch', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553804676-L.jpg', description: 'Gentleman bastards.', category: 'Fantasy' },
  { id: 'assassins-apprentice', title: "Assassin's Apprentice", author: 'Robin Hobb', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553374452-L.jpg', description: 'The Farseer Trilogy.', category: 'Fantasy' },
  { id: 'the-eye-of-the-world', title: 'The Eye of the World', author: 'Robert Jordan', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780312850098-L.jpg', description: 'The Wheel of Time turns.', category: 'Fantasy' },
  
  // Sci-Fi
  { id: 'the-three-body-problem', title: 'The Three-Body Problem', author: 'Cixin Liu', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780765377067-L.jpg', description: 'Humanity\'s first contact.', category: 'Sci-Fi', isBestSeller: true },
  { id: 'snow-crash', title: 'Snow Crash', author: 'Neal Stephenson', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553351927-L.jpg', description: 'Metaverse and linguistic viruses.', category: 'Sci-Fi' },
  { id: 'brave-new-world-2', title: 'Brave New World', author: 'Aldous Huxley', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg', description: 'A utopian nightmare.', category: 'Sci-Fi' },
  { id: 'hyperion-simmons', title: 'Hyperion', author: 'Dan Simmons', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553283686-L.jpg', description: 'The Shrike and the pilgrims.', category: 'Sci-Fi' },
  
  // Business & Finance
  { id: 'principals-dalio', title: 'Principles', author: 'Ray Dalio', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781501124020-L.jpg', description: 'Life and work principles.', category: 'Business', isBestSeller: true },
  { id: 'hard-thing-about-hard-things', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780062273208-L.jpg', description: 'Building a business when there are no easy answers.', category: 'Business' },
  { id: 'lean-startup', title: 'The Lean Startup', author: 'Eric Ries', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg', description: 'Continuous innovation for success.', category: 'Business', isBestSeller: true },
  { id: 'good-to-great', title: 'Good to Great', author: 'Jim Collins', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780066620992-L.jpg', description: 'Why some companies make the leap.', category: 'Business' },

  // History & Biography
  { id: 'the-diary-of-anne-frank', title: 'The Diary of a Young Girl', author: 'Anne Frank', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780553296983-L.jpg', description: 'A voice from the shadows.', category: 'Biography', isBestSeller: true },
  { id: 'long-walk-to-freedom', title: 'Long Walk to Freedom', author: 'Nelson Mandela', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780316548182-L.jpg', description: 'The autobiography of Nelson Mandela.', category: 'Biography' },
  { id: 'churchill-walking-with-destiny', title: 'Churchill: Walking with Destiny', author: 'Andrew Roberts', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781101980996-L.jpg', description: 'A definitive biography.', category: 'Biography' },
  { id: 'the-silk-roads', title: 'The Silk Roads', author: 'Peter Frankopan', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781101912379-L.jpg', description: 'A new history of the world.', category: 'History' },
  { id: 'spqr-beard', title: 'SPQR', author: 'Mary Beard', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780871404237-L.jpg', description: 'A history of ancient Rome.', category: 'History' },

  // Psychology & Self-Help
  { id: 'thinking-fast-and-slow', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg', description: 'The two systems of thought.', category: 'Psychology', isBestSeller: true },
  { id: 'quiet-susan-cain', title: 'Quiet', author: 'Susan Cain', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780307352149-L.jpg', description: 'The power of introverts.', category: 'Psychology' },
  { id: 'daring-greatly', title: 'Daring Greatly', author: 'Brené Brown', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781592407330-L.jpg', description: 'The courage to be vulnerable.', category: 'Self-Help' },
  { id: 'the-body-keeps-the-score', title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780670785933-L.jpg', description: 'Brain, mind, and body in the healing of trauma.', category: 'Psychology', isBestSeller: true },
  { id: 'man-and-his-symbols', title: 'Man and His Symbols', author: 'Carl Jung', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780440351832-L.jpg', description: 'The world of dreams and archetypes.', category: 'Psychology' },
  { id: 'influence-cialdini', title: 'Influence: The Psychology of Persuasion', author: 'Robert Cialdini', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780061241895-L.jpg', description: 'How to say yes.', category: 'Psychology' },
  { id: 'blink-gladwell', title: 'Blink', author: 'Malcolm Gladwell', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780316172325-L.jpg', description: 'The power of thinking without thinking.', category: 'Psychology' },
  { id: 'outliers-gladwell', title: 'Outliers', author: 'Malcolm Gladwell', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780316017923-L.jpg', description: 'The story of success.', category: 'Psychology', isBestSeller: true },
  { id: 'grit-duckworth', title: 'Grit', author: 'Angela Duckworth', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781501111105-L.jpg', description: 'The power of passion and perseverance.', category: 'Self-Help' },
  { id: 'limitless-kwik', title: 'Limitless', author: 'Jim Kwik', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781401958237-L.jpg', description: 'Upgrade your brain, learn anything faster.', category: 'Productivity' },
  { id: 'the-one-thing', title: 'The ONE Thing', author: 'Gary Keller', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781885167774-L.jpg', description: 'The surprisingly simple truth behind extraordinary results.', category: 'Productivity' },
  { id: 'make-it-stick', title: 'Make It Stick', author: 'Peter C. Brown', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780674729018-L.jpg', description: 'The science of successful learning.', category: 'Productivity' },
  { id: 'show-your-work', title: 'Show Your Work!', author: 'Austin Kleon', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780761178972-L.jpg', description: '10 ways to share your creativity.', category: 'Self-Help' },
  { id: 'steal-like-an-artist', title: 'Steal Like an Artist', author: 'Austin Kleon', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780761169253-L.jpg', description: '10 things nobody told you about being creative.', category: 'Self-Help' },
  { id: 'big-magic-gilbert', title: 'Big Magic', author: 'Elizabeth Gilbert', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781594634710-L.jpg', description: 'Creative living beyond fear.', category: 'Self-Help' },
  { id: 'war-of-art', title: 'The War of Art', author: 'Steven Pressfield', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780446691437-L.jpg', description: 'Break through blocks and win inner creative battles.', category: 'Productivity' },
  { id: 'ikigai-lifestyle', title: 'The Little Book of Ikigai', author: 'Ken Mogi', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781786485793-L.jpg', description: 'The essential Japanese guide.', category: 'Philosophy' },
  { id: 'the-daily-stoic', title: 'The Daily Stoic', author: 'Ryan Holiday', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211735-L.jpg', description: '366 days of Stoic wisdom.', category: 'Philosophy', isBestSeller: true },
  { id: 'ego-is-the-enemy', title: 'Ego Is the Enemy', author: 'Ryan Holiday', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9781591847816-L.jpg', description: 'The battle to master our greatest opponent.', category: 'Philosophy' },
  { id: 'stillness-is-key', title: 'Stillness Is the Key', author: 'Ryan Holiday', price: 199, coverImage: 'https://covers.openlibrary.org/b/isbn/9780525538585-L.jpg', description: 'The secret to clarity and presence.', category: 'Philosophy' },
];

export const combos: Combo[] = [
  {
    id: 'combo-10',
    name: 'Wisdom Starter (10 Books)',
    bookCount: 10,
    price: 1490,
    pricePerBook: 149,
    coverImage: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1740212345/combo_10_placeholder.png',
    books: [
      'nature-of-the-divine', 'the-power-of-now', 'untethered-soul', 'mans-search-for-meaning', 
      'the-four-agreements', 'atomic-habits', 'ikigai', 'subtle-art', 'think-like-a-monk', 'psychology-of-money'
    ],
    description: 'A curated collection of 10 essential self-help and spiritual books to jumpstart your personal growth journey.',
  },
  {
    id: 'combo-20',
    name: 'Seeker Suite (20 Books)',
    bookCount: 20,
    price: 2580,
    pricePerBook: 129,
    coverImage: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1740212345/combo_20_placeholder.png',
    books: [
      'nature-of-the-divine', 'the-power-of-now', 'untethered-soul', 'mans-search-for-meaning', 
      'the-four-agreements', 'atomic-habits', 'ikigai', 'subtle-art', 'think-like-a-monk', 'psychology-of-money',
      'sapiens', '1984-orwell', 'brave-new-world', 'the-great-gatsby', 'to-kill-a-mockingbird',
      'the-alchemist-coelho', 'catcher-in-the-rye', 'pride-and-prejudice', 'the-little-prince', 'life-of-pi'
    ],
    description: 'A comprehensive library of 20 books for the dedicated seeker of truth and productivity.',
  },
  {
    id: 'combo-30',
    name: 'Divine Library (30 Books)',
    bookCount: 30,
    price: 3570,
    pricePerBook: 119,
    coverImage: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1740212345/combo_30_placeholder.png',
    books: [
      'nature-of-the-divine', 'the-power-of-now', 'untethered-soul', 'mans-search-for-meaning', 
      'the-four-agreements', 'atomic-habits', 'ikigai', 'subtle-art', 'think-like-a-monk', 'psychology-of-money',
      'sapiens', '1984-orwell', 'brave-new-world', 'the-great-gatsby', 'to-kill-a-mockingbird',
      'the-alchemist-coelho', 'catcher-in-the-rye', 'pride-and-prejudice', 'the-little-prince', 'life-of-pi',
      'kite-runner', 'the-hobbit', 'fellowship-of-ring', 'harry-potter-1', 'game-of-thrones',
      'the-name-of-the-wind', 'american-gods', 'circe-miller', 'good-omens', 'the-prince-machiavelli'
    ],
    description: '30 masterpieces covering every aspect of human life — from spiritual awakening to peak performance.',
  },
  {
    id: 'combo-40',
    name: 'The Ultimate Collection (40 Books)',
    bookCount: 40,
    price: 3960,
    pricePerBook: 99,
    coverImage: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1740212345/combo_40_placeholder.png',
    books: [
      'nature-of-the-divine', 'the-power-of-now', 'untethered-soul', 'mans-search-for-meaning', 
      'the-four-agreements', 'atomic-habits', 'ikigai', 'subtle-art', 'think-like-a-monk', 'psychology-of-money',
      'sapiens', '1984-orwell', 'brave-new-world', 'the-great-gatsby', 'to-kill-a-mockingbird',
      'the-alchemist-coelho', 'catcher-in-the-rye', 'pride-and-prejudice', 'the-little-prince', 'life-of-pi',
      'kite-runner', 'the-hobbit', 'fellowship-of-ring', 'harry-potter-1', 'game-of-thrones',
      'the-name-of-the-wind', 'american-gods', 'circe-miller', 'good-omens', 'the-prince-machiavelli',
      'on-liberty-mill', 'the-republic-plato', 'wealth-of-nations', 'communist-manifesto', 'the-guns-of-august',
      'team-of-rivals', 'the-splendid-and-vile', 'dune-herbert', 'foundation-asimov', 'neuromancer-gibson'
    ],
    description: 'Our most ambitious collection. 40 books that define the essence of self-mastery and divine understanding.',
  }
];

export const synopsis = `
<p class="mb-6 py-2 px-4 border-l-2 border-primary/20 italic text-xl md:text-2xl font-garamond leading-relaxed">
  "The ego is a heavy cloak. To know the Divine, one must learn to become as light as a feather."
</p>

<p class="mb-4">Are you navigating a world of mental static, seeking the clear signal of <i class="font-garamond">Inner Truth</i>? <i class="font-garamond">The Nature of the Divine</i> by Alfas B is a revolutionary blueprint for the modern soul—a bridge between the unyielding logic of the mind and the infinite depth of <i class="font-garamond">Divine Consciousness</i>.</p>

<p class="mb-4">For the intellectually honest seeker, the meditation practitioner, and the skeptic who yearns for depth, this work transcends traditional religious dogma. It invites you into a rigorous, yet deeply poetic inquiry into the mechanics of <i class="font-garamond">Spiritual Awakening</i> and the architecture of <i class="font-garamond">Cosmic Intelligence</i>.</p>

<p>Unlock the <i class="font-garamond">Divine Code</i> hidden within your own cognitive static. Learn to detoxify the mind, dissolve the friction of resistance, and step into a frequency of <i class="font-garamond">Inner Peace</i> that remains unshakable. Your journey toward <i class="font-garamond">Self-Realization</i> and the ultimate alignment begins here.</p>
`;

export const authorBio = `
<p class="mb-4">Alfas B. is a visionary spiritual philosopher and computer engineer who deciphers the hidden symmetries between <i class="font-garamond">Linear Logic</i> and <i class="font-garamond">Universal Intelligence</i>. Unsatisfied with the ambiguity of modern spirituality, he applied the precision of a programmer to the study of the human soul, revealing the consistent algorithms of <i class="font-garamond">Spiritual Evolution</i>.</p>

<p>He writes for the 'Thinking Seeker'—individuals who require a path as grounded in reality as it is elevated in spirit. His philosophy offers a transformation that is intellectually defensible yet "light as a feather," guiding readers to shed the density of the ego and activate the <i class="font-garamond">Brilliant Existence</i> that has always resided within. His work is a beacon for those seeking clarity, purpose, and alignment with the divine.</p>
`;

export const sampleChapters = [
  {
    number: 1,
    title: "The Prime Mover (God)",
    content: `Chapter one dismantles the archaic anthropomorphic God to reveal the Pulse of Infinite Intelligence. It guides the seeker beyond the static of belief, opening the inner eye to the tangible, mathematical, and poetic truths of existence. Discover how every atom is a witness to the Divine, and how moving from blind faith to direct perception is the first step in the Great Alignment.`,
    locked: false
  },
  {
    number: 2,
    title: "The Divine Blueprint (Man)",
    content: `Chapter two illuminates the human condition as the chosen interface for Cosmic Expression. It introduces a high-consequence meditation habit—a technology of the soul—designed to align human intent with Universal Will. By stripping away the conditioning of the world, you uncover your primary purpose: to be a conscious instrument of the Divine.`,
    locked: false
  }
];

export const buyLinks = [
  {
    name: "Amazon",
    url: "https://amzn.in/d/iPmewQL",
    visible: true,
  },
  {
    name: "Flipkart",
    url: "https://www.flipkart.com/nature-divine-align/p/itm2433ecc20ab88?pid=9789334306514",
    visible: true,
  }
];
