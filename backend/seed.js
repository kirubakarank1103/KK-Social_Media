const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User  = require("./models/User");
const Post  = require("./models/Post");
const Story = require("./models/Story");

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected!\n");
}

const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

// ─── USERS ────────────────────────────────────────────────────
const USERS = [
  { username: "vijay_thalapathy",   fullName: "Vijay Kumar",         bio: "Thalapathy fan forever | Beast mode always ON", isVerified: true  },
  { username: "ajith_thala_fan",    fullName: "Ajith Lover",         bio: "Thala Ajith is life | Speed lover 🏎️",          isVerified: true  },
  { username: "rajini_superstar",   fullName: "Rajinikanth Fan",     bio: "Superstar Rajini | Style is everything",         isVerified: true  },
  { username: "suriya_si3_fan",     fullName: "Suriya Sivakumar",    bio: "Singam forever | Suriya is love 🦁",             isVerified: false },
  { username: "dhanush_fan_tn",     fullName: "Dhanush Fan",         bio: "Why this kolaveri | D fan always",               isVerified: false },
  { username: "lord_murugan_dev",   fullName: "Murugan Devotee",     bio: "Vel Muruga Haro Hara 🪔 | Daily prayers",        isVerified: true  },
  { username: "lord_shiva_bhakt",   fullName: "Shiva Devotee",       bio: "Om Namah Shivaya 🔱 | Blessed always",           isVerified: true  },
  { username: "ganesh_bhakti",      fullName: "Ganesh Devotee",      bio: "Om Gam Ganapataye Namah 🐘 | Remove obstacles",  isVerified: false },
  { username: "marina_sunsets",     fullName: "Meena Sundaram",      bio: "Marina Beach sunsets every evening | Chennai",   isVerified: false },
  { username: "coimbatore_clicks",  fullName: "Karthik Rajan",       bio: "Kovai photographer | Nature and streets",        isVerified: false },
  { username: "madurai_temple",     fullName: "Priya Pandian",       bio: "Temple architecture lover | Madurai",            isVerified: false },
  { username: "ooty_vibes",         fullName: "Arun Nilgiris",       bio: "Tea estates and cold weather | Ooty hills",      isVerified: false },
  { username: "kollywood_buzz",     fullName: "Deepa Selvan",        bio: "Tamil cinema lover | Script writer dreams",      isVerified: true  },
  { username: "saravana_foodie",    fullName: "Saravanan M",         bio: "Saravana Bhavan fan | Filter coffee addict",     isVerified: false },
  { username: "pondy_waves",        fullName: "Lakshmi Pondicherry", bio: "French Quarter walks | Pondicherry soul",        isVerified: false },
  { username: "rameswaram_ravi",    fullName: "Ravi Sethu",          bio: "Pamban bridge photos | Rameswaram diaries",      isVerified: false },
  { username: "kodai_princess",     fullName: "Kavitha Kodai",       bio: "Kodaikanal mist and flowers | Hill station life",isVerified: false },
  { username: "chennai_beats",      fullName: "Arjun Chennai",       bio: "Carnatic music | T.Nagar streets lover",         isVerified: false },
  { username: "tanjore_art",        fullName: "Ananya Thanjavur",    bio: "Tanjore painting artist | Classical arts",       isVerified: true  },
  { username: "ecr_explorer",       fullName: "Dinesh ECR",          bio: "East Coast Road trips | Beach shacks and sunsets",isVerified: false },
  { username: "tn_techie",          fullName: "Ramesh IT Park",      bio: "Chennai IT corridor | Tidel Park developer",     isVerified: false },
  { username: "carnatic_queen",     fullName: "Sudha Raghavan",      bio: "Vocalist | Music Academy Chennai | Classical",   isVerified: true  },
  { username: "kovai_kutti",        fullName: "Saranya Kovai",       bio: "Flower market mornings | Coimbatore girl",       isVerified: false },
  { username: "kanyakumari_views",  fullName: "Kumar Kanyakumari",   bio: "Three oceans meet here | Sunrise chaser",        isVerified: false },
  { username: "tn_biker",           fullName: "Selvam Rider",        bio: "Highway rides | ECR to Mahabalipuram weekends",  isVerified: false },
];

// ─── WORKING IMAGE URLS ───────────────────────────────────────
// Using picsum.photos — always works, no expiry
const IMAGE_URLS = [
  // Actors / People (pravatar — reliable face photos)
  "https://picsum.photos/seed/vijay1/800/800",
  "https://picsum.photos/seed/actor2/800/800",
  "https://picsum.photos/seed/rajini/800/800",
  "https://picsum.photos/seed/suriya/800/800",
  "https://picsum.photos/seed/dhanush/800/800",
  // Gods / Temples
  "https://picsum.photos/seed/temple1/800/800",
  "https://picsum.photos/seed/temple2/800/800",
  "https://picsum.photos/seed/temple3/800/800",
  "https://picsum.photos/seed/murugan/800/800",
  "https://picsum.photos/seed/ganesh1/800/800",
  // Nature / Hills
  "https://picsum.photos/seed/ooty1/800/800",
  "https://picsum.photos/seed/hills2/800/800",
  "https://picsum.photos/seed/nature3/800/800",
  "https://picsum.photos/seed/forest1/800/800",
  "https://picsum.photos/seed/sunrise1/800/800",
  // Beach
  "https://picsum.photos/seed/beach1/800/800",
  "https://picsum.photos/seed/marina/800/800",
  "https://picsum.photos/seed/ocean1/800/800",
  "https://picsum.photos/seed/coastal/800/800",
  "https://picsum.photos/seed/waves1/800/800",
  // Food
  "https://picsum.photos/seed/food1/800/800",
  "https://picsum.photos/seed/biryani/800/800",
  "https://picsum.photos/seed/dosa123/800/800",
  "https://picsum.photos/seed/coffee1/800/800",
  "https://picsum.photos/seed/food5/800/800",
  // City / Street
  "https://picsum.photos/seed/city1/800/800",
  "https://picsum.photos/seed/street1/800/800",
  "https://picsum.photos/seed/market1/800/800",
  "https://picsum.photos/seed/village1/800/800",
  "https://picsum.photos/seed/india1/800/800",
];

// ─── VIDEO URLS ────────────────────────────────────────────────
const VIDEO_URLS = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4",
];

// ─── ENGLISH CAPTIONS ─────────────────────────────────────────
const CAPTIONS = [
  // Vijay / Actor themed
  "Thalapathy Vijay — the one and only GOAT 🦁🔥",
  "Beast mode activated! Vijay sir always inspires 💪",
  "Thala Ajith racing through life like a champion 🏎️",
  "Superstar Rajini — style that never gets old ✨",
  "Suriya is the definition of dedication and heart 🦁",
  "Dhanush proves that talent beats everything else 🎵",
  // God themed
  "Vel Muruga bless us all! Kavadi time 🪔🙏",
  "Om Namah Shivaya — peace in every breath 🔱",
  "Lord Ganesha removes all obstacles in our path 🐘✨",
  "Temple visit done! Soul feels so refreshed 🛕🙏",
  "Morning prayers at the temple — best start to the day",
  "Meenakshi Amman temple — architecture beyond words 🛕",
  // Nature
  "Ooty tea estates in the morning mist — pure magic 🍵",
  "Kodaikanal view from the top — absolutely breathtaking 🌿",
  "Sunset at Marina Beach — nothing beats this feeling 🌅",
  "East Coast Road drive — best therapy ever 🏍️🌊",
  "Pamban bridge — engineering meets beauty 📸",
  // Food
  "Filter coffee is not just a drink, it is a lifestyle ☕❤️",
  "Biryani from Madurai — the aroma hits different 🍖🔥",
  "Saravana Bhavan meals — best vegetarian food on earth 🍛",
  "Dosa and sambar on a rainy morning — perfect combo 🌧️",
  // Life
  "Every day is a blessing — count them all 🙏✨",
  "Friends who travel together stay together forever 🗺️❤️",
  "Good vibes only — life is too short for negativity 🌟",
  "Weekends are made for adventures and good memories 🏕️",
  "Chennai rains hit different when you are with family 🌧️",
  "Coimbatore flower market — colours of life 🌺💐",
  "Kanyakumari — where three oceans meet at sunrise 🌊🌅",
  "Arunachala hill — silence that speaks to the soul 🪔",
  "Silk sarees from Kanchipuram — tradition is timeless 👗",
  "Pongal celebration — harvest festival of Tamil Nadu 🌾🎊",
];

// ─── COMMENTS (English) ───────────────────────────────────────
const COMMENTS = [
  "Absolutely love this! 🔥",
  "This is so beautiful! 😍",
  "Amazing shot! 📸",
  "What a view! 🌅",
  "My favourite place too! ❤️",
  "Great photo bro! 👏",
  "Tamil pride always! 🦁",
  "Keep posting more! 🙌",
  "Beautiful! Love your content 🔥",
  "When did you visit? I want to go too! 🗺️",
  "This looks so amazing! 🙌",
  "Drop the location please! 📍",
  "Wow just wow! 😮",
  "Pure magic! 🪄",
  "Absolutely stunning! ✨",
  "This is everything! 💯",
  "God bless you always! 🙏",
  "Thalapathy fans unite! 🦁🔥",
  "Filter coffee ready? ☕",
  "Tamil Nadu is the best! 🌟",
];

// ─── LOCATIONS ────────────────────────────────────────────────
const LOCATIONS = [
  "Marina Beach, Chennai",
  "T. Nagar, Chennai",
  "Madurai Meenakshi Temple",
  "Ooty, Nilgiris",
  "Kodaikanal",
  "Pondicherry",
  "Rameswaram",
  "Kanyakumari",
  "Coimbatore",
  "Thanjavur",
  "Mahabalipuram",
  "Tiruvannamalai",
  "East Coast Road, Chennai",
  "Valparai",
  "Courtallam Falls",
];

const PROFILE_PICS = Array.from({ length: 25 }, (_, i) =>
  `https://i.pravatar.cc/150?img=${i + 1}`
);

// ─── MAIN SEED ────────────────────────────────────────────────
async function seed() {
  try {
    await connectDB();
    console.log("🚀 Seeding started!\n");

    // 1. CLEAN
    console.log("🗑️  Clearing old data...");
    await User.deleteMany({});
    await Post.deleteMany({});
    await Story.deleteMany({});
    console.log("✅ Old data cleared!\n");

    // 2. CREATE USERS
    console.log("👥 Creating 25 users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const createdUsers = [];

    for (let i = 0; i < USERS.length; i++) {
      const u = USERS[i];
      const user = new User({
        username:       u.username,
        fullName:       u.fullName,
        email:          `${u.username}@example.com`,
        password:       hashedPassword,
        bio:            u.bio,
        profilePicture: PROFILE_PICS[i],
        isVerified:     u.isVerified,
        followers:      [],
        following:      [],
      });
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ ${createdUsers.length} users created!\n`);

    // 3. FOLLOWS
    console.log("🤝 Setting up follows...");
    for (const user of createdUsers) {
      const others   = createdUsers.filter((u) => !u._id.equals(user._id));
      const toFollow = pickN(others, randN(8, 18));
      await User.findByIdAndUpdate(user._id, { $set: { following: toFollow.map((u) => u._id) } });
      for (const followed of toFollow) {
        await User.findByIdAndUpdate(followed._id, { $addToSet: { followers: user._id } });
      }
    }
    console.log("✅ Follows done!\n");

    // 4. CREATE POSTS
    console.log("📸 Creating posts...");
    const allPosts = [];
    const shuffledImages = [...IMAGE_URLS].sort(() => 0.5 - Math.random());
    let imgIdx = 0;

    for (const user of createdUsers) {
      const postCount = randN(3, 7);
      for (let p = 0; p < postCount; p++) {
        const isVideo  = Math.random() < 0.15;
        const mediaUrl = isVideo
          ? rand(VIDEO_URLS)
          : shuffledImages[imgIdx++ % shuffledImages.length];
        const daysAgo  = randN(0, 60);

        const post = new Post({
          author:    user._id,
          image:     mediaUrl,
          mediaType: isVideo ? "video" : "image",
          caption:   rand(CAPTIONS),
          location:  Math.random() > 0.3 ? rand(LOCATIONS) : "",
          likes:     [],
          comments:  [],
          createdAt: new Date(Date.now() - daysAgo * 86400000),
        });
        await post.save();
        allPosts.push(post);
      }
    }
    console.log(`✅ ${allPosts.length} posts created!\n`);

    // 5. LIKES
    console.log("❤️  Adding likes...");
    for (const post of allPosts) {
      const likers = pickN(createdUsers, randN(5, createdUsers.length - 1));
      await Post.findByIdAndUpdate(post._id, { $set: { likes: likers.map((u) => u._id) } });
    }
    console.log("✅ Likes done!\n");

    // 6. COMMENTS
    console.log("💬 Adding comments...");
    for (const post of allPosts) {
      const commenters = pickN(createdUsers, randN(2, 8));
      const comments   = commenters.map((u) => ({
        user:      u._id,
        text:      rand(COMMENTS),
        createdAt: new Date(Date.now() - randN(0, 50) * 86400000),
      }));
      await Post.findByIdAndUpdate(post._id, { $set: { comments } });
    }
    console.log("✅ Comments done!\n");

    // 7. STORIES
    console.log("📖 Creating stories...");
    const storyUsers = pickN(createdUsers, 15);
    let storyCount   = 0;
    for (const user of storyUsers) {
      const count = randN(1, 3);
      for (let s = 0; s < count; s++) {
        const isVideo  = Math.random() < 0.15;
        const mediaUrl = isVideo ? rand(VIDEO_URLS) : rand(IMAGE_URLS);
        const hoursAgo = randN(1, 22);
        await Story.create({
          author:    user._id,
          mediaType: isVideo ? "video" : "image",
          mediaUrl,
          viewers:   pickN(createdUsers, randN(3, 12)).map((u) => u._id),
          expiresAt: new Date(Date.now() + (24 - hoursAgo) * 3600000),
          createdAt: new Date(Date.now() - hoursAgo * 3600000),
        });
        storyCount++;
      }
    }
    console.log(`✅ ${storyCount} stories created!\n`);

    // ─── SUMMARY ──────────────────────────────────────────────
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SEEDING COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👥 Users   : ${createdUsers.length}`);
    console.log(`📸 Posts   : ${allPosts.length}`);
    console.log(`📖 Stories : ${storyCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔑 Login with any username + password: password123");
    console.log("   Example: vijay_thalapathy / password123\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();