const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const userModel = require('./src/modal/user');
const connectionModel = require('./src/modal/connection');
const messageModel = require('./src/modal/message');
const announcementModel = require('./src/modal/announcement');
const dbConnect = require('./src/config/database');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const frontendProfilesDir = path.resolve(__dirname, '..', 'frontend', 'public', 'profiles');

const personas = [
  { id: "virat_kohli", name: "Virat Kohli", gender: "male", age: 35, job: "Cricketer", location: "Mumbai, India", bio: "Passionate about high performance on the pitch, intense gym sessions, and healthy living. 🏏💪⚡", interests: ["Cricket", "Fitness", "Nutrition", "Travel"] },
  { id: "anushka_sharma", name: "Anushka Sharma", gender: "female", age: 36, job: "Actress, Producer", location: "Mumbai, India", bio: "Producing meaningful cinema, practicing daily yoga, and finding peace in mountain retreats. 🎬🧘‍♀️🐾", interests: ["Cinema", "Storytelling", "Animal Welfare", "Yoga"] },
  { id: "rohit_sharma", name: "Rohit Sharma", gender: "male", age: 37, job: "Cricketer", location: "Mumbai, India", bio: "Leading from the front with effortless timing. Big on Mumbai street food & marine conservation. 🏏🌊🍔", interests: ["Cricket", "Ocean Conservation", "Food", "Gaming"] },
  { id: "deepika_padukone", name: "Deepika Padukone", gender: "female", age: 38, job: "Actress, Entrepreneur", location: "Bangalore, India", bio: "Advocating mental health awareness, building holistic self-care brands, and loving a badminton match. 🏸✨🌿", interests: ["Mental Health", "Badminton", "Skincare", "Fashion"] },
  { id: "hardik_pandya", name: "Hardik Pandya", gender: "male", age: 30, job: "Cricketer", location: "Baroda, India", bio: "All-rounder living life with fearless swagger and high energy. Big beats, luxury style, and clutch wins. 🏏🔥💎", interests: ["Cricket", "Fashion", "Luxury Watches", "Fitness"] },
  { id: "anushka_sen", name: "Anushka Sen", gender: "female", age: 22, job: "Actress, Influencer", location: "Mumbai, India", bio: "Global youth icon exploring K-dramas, international fashion weeks, and connecting with millions. 🇰🇷✨🎬", interests: ["Korean Culture", "Fashion", "Travel", "Dance"] },
  { id: "kl_rahul", name: "KL Rahul", gender: "male", age: 32, job: "Cricketer", location: "Bangalore, India", bio: "Classic batting elegance, curated streetwear aesthetic, and cold brew obsession. 🏏☕👟", interests: ["Cricket", "Streetwear", "Tattoos", "Coffee"] },
  { id: "rashmika_mandanna", name: "Rashmika Mandanna", gender: "female", age: 28, job: "Actress", location: "Hyderabad, India", bio: "National crush bringing infectious positive energy, love for furry pets, and blockbuster films! 🌸🐾🎬", interests: ["Cinema", "Anime", "Fitness", "Pets"] },
  { id: "jasprit_bumrah", name: "Jasprit Bumrah", gender: "male", age: 30, job: "Cricketer", location: "Ahmedabad, India", bio: "Unorthodox bowling action delivering world-class precision. Humble off the field, fierce on it. 🎯🏏⚡", interests: ["Cricket", "Video Games", "Sneakers", "Fitness"] },
  { id: "sara_ali_khan", name: "Sara Ali Khan", gender: "female", age: 29, job: "Actress", location: "Mumbai, India", bio: "Namaste Darshako! Columbia grad who loves historical monuments, hilarious rhymes, and mountain treks. 🙏⛰️✨", interests: ["History", "Shayari", "Trekking", "Indian Wear"] },
  { id: "ranveer_singh", name: "Ranveer Singh", gender: "male", age: 39, job: "Actor, Entrepreneur", location: "Mumbai, India", bio: "Limitless energy, daring fashion statements, and complete dedication to the craft of storytelling. ⚡🎤💥", interests: ["Avant-Garde Fashion", "Hip-Hop", "Gym", "Cinema"] },
  { id: "alia_bhatt", name: "Alia Bhatt", gender: "female", age: 31, job: "Actress, Entrepreneur", location: "Mumbai, India", bio: "National Award-winning artist, conscious entrepreneur, and proud cat mom. Loving wholesome cinema. 🐾🌱🎬", interests: ["Eco-Fashion", "Cats", "Cinema", "Reading"] },
  { id: "shubman_gill", name: "Shubman Gill", gender: "male", age: 24, job: "Cricketer", location: "Chandigarh, India", bio: "Prince of Indian cricket with pure timing and modern swag. Big fan of gaming marathons & streetwear. 🏏👑👟", interests: ["Cricket", "Fashion", "Gaming", "Hip-Hop"] },
  { id: "avneet_kaur", name: "Avneet Kaur", gender: "female", age: 22, job: "Actress, Influencer", location: "Mumbai, India", bio: "From reality TV prodigy to Cannes red carpets. Fashion, dance reels, and world travel diary! 💃👗✨", interests: ["Fashion", "Dance", "Reels", "Travel"] },
  { id: "vicky_kaushal", name: "Vicky Kaushal", gender: "male", age: 36, job: "Actor", location: "Mumbai, India", bio: "How's the josh? High sir! Engineer turned passionate actor who loves soulful Punjabi music & parathas. 🎬🕺🔥", interests: ["Punjabi Folk", "Cinema", "Gym", "Food"] },
  { id: "kiara_advani", name: "Kiara Advani", gender: "female", age: 32, job: "Actress", location: "Mumbai, India", bio: "Bringing grace and authentic emotion to the silver screen. Dedicated to fitness and finding magic. ✨🤍🎬", interests: ["Cinema", "Fitness", "Skincare", "Travel"] },
  { id: "diljit_dosanjh", name: "Diljit Dosanjh", gender: "male", age: 40, job: "Singer, Actor", location: "Chandigarh, India", bio: "Punjabi aa gaye oye! Taking Punjabi music and culture to stadiums worldwide. Born on Shine. 🎤🌍✨", interests: ["Punjabi Music", "Coachella", "High Fashion", "Cooking"] },
  { id: "neha_kakkar", name: "Neha Kakkar", gender: "female", age: 36, job: "Singer", location: "Delhi, India", bio: "Singing from the heart with pure passion and connecting with billions of listeners worldwide. 🎶💖🎙️", interests: ["Singing", "Music Videos", "Family", "Travel"] },
  { id: "badshah", name: "Badshah", gender: "male", age: 38, job: "Rapper, Music Producer", location: "Delhi, India", bio: "It's your boy Badshah! Engineering chart-topping anthems and collecting rare Jordan sneakers. 🎧👟🔥", interests: ["Desi Hip Hop", "Sneakerhead", "Supercars", "Music"] },
  { id: "nora_fatehi", name: "Nora Fatehi", gender: "female", age: 32, job: "Dancer, Actress", location: "Mumbai, India", bio: "Global dance powerhouse fusing Moroccan, Afro, and Bollywood rhythms on the world stage. 💃🔥🌍", interests: ["Afrobeats", "Bellydance", "Fashion", "Fitness"] },
  { id: "ayushmann_khurrana", name: "Ayushmann Khurrana", gender: "male", age: 39, job: "Actor, Singer", location: "Chandigarh, India", bio: "Pani Da Rang... Actor championing taboobreaking cinema and writing soulful poetry over midnight chai. 🎸✍️☕", interests: ["Poetry", "Acoustic Music", "Social Cinema", "Cricket"] },
  { id: "shraddha_kapoor", name: "Shraddha Kapoor", gender: "female", age: 37, job: "Actress, Singer", location: "Mumbai, India", bio: "Stree star who loves sea breeze, soulful unplugged melodies, cutting chai, and rescue dogs. 🐕🌧️🎶", interests: ["Nature", "Pets", "Singing", "Eco-Living"] },
  { id: "kartik_aaryan", name: "Kartik Aaryan", gender: "male", age: 33, job: "Actor", location: "Gwalior, India", bio: "From engineering classrooms to Bollywood blockbusters. Big on relatable humor & football. 🎬⚽🌟", interests: ["Cinema", "Monologues", "Football", "Street Food"] },
  { id: "kriti_sanon", name: "Kriti Sanon", gender: "female", age: 34, job: "Actress, Entrepreneur", location: "Delhi, India", bio: "Engineer turned National Award winner and founder of Hyphen. Love deep poetry & fitness. 🌿📖✨", interests: ["Skincare", "Poetry", "Cinema", "Fitness"] },
  { id: "vijay_deverakonda", name: "Vijay Deverakonda", gender: "male", age: 35, job: "Actor, Entrepreneur", location: "Hyderabad, India", bio: "The Rowdy boy. Passionate about unfiltered cinema, community brands, and volleyball. 🏐🔥🕶️", interests: ["Rowdy Wear", "Cinema", "Volleyball", "Fitness"] },
  { id: "tamannaah_bhatia", name: "Tamannaah Bhatia", gender: "female", age: 34, job: "Actress, Entrepreneur", location: "Mumbai, India", bio: "Versatile pan-Indian star bridging diverse industries. Passionate about classical dance & jewelry. 💃✨👑", interests: ["Dance", "Jewelry Design", "Cinema", "Yoga"] },
  { id: "arijit_singh", name: "Arijit Singh", gender: "male", age: 37, job: "Singer, Musician", location: "Jiaganj, India", bio: "Finding harmony in simplicity. Living close to roots, practicing ragas, and creating melodies. 🎶🎸🌿", interests: ["Classical Music", "Sound Engineering", "Simple Village Life"] },
  { id: "shreya_ghoshal", name: "Shreya Ghoshal", gender: "female", age: 40, job: "Singer", location: "Mumbai, India", bio: "Four-time National Award-winning melody queen. Blessed to touch hearts through pure notes. 🎼🌸☕", interests: ["Classical Ragas", "World Music", "Cooking", "Gardening"] },
  { id: "ranbir_kapoor", name: "Ranbir Kapoor", gender: "male", age: 41, job: "Actor", location: "Mumbai, India", bio: "Living through characters on screen. Hardcore FC Barcelona fan, sneakerhead, and observer. ⚽🎬👟", interests: ["Football", "Sneakers", "Cinema", "Barca"] },
  { id: "priyanka_chopra", name: "Priyanka Chopra Jonas", gender: "female", age: 42, job: "Actress, Producer", location: "Mumbai, India", bio: "Global trailblazer. From Miss World to Hollywood, championing women empowerment & bold dreams. 🌍👑✨", interests: ["Global Cinema", "Philanthropy", "Writing", "Entrepreneurship"] },
  { id: "sidharth_malhotra", name: "Sidharth Malhotra", gender: "male", age: 39, job: "Actor", location: "Delhi, India", bio: "Delhi boy who loves intense workouts, riding motorcycles through scenic highways, and dogs. 🏍️🐕🏋️‍♂️", interests: ["Fitness", "Dogs", "Action Films", "Motorcycles"] },
  { id: "disha_patani", name: "Disha Patani", gender: "female", age: 32, job: "Actress, Model", location: "Bareilly, India", bio: "Action cinema addict, kickboxer, and anime fan. Catch me doing backflips on the beach or binging Goku! 🥋🏖️🐱", interests: ["Martial Arts", "Anime", "Beaches", "Gym"] },
  { id: "rajkummar_rao", name: "Rajkummar Rao", gender: "male", age: 39, job: "Actor", location: "Gurgaon, India", bio: "Living for transformative cinema and honest storytelling. FTII graduate who works relentlessly. 🎭☕🏆", interests: ["Method Acting", "Cinema", "Taekwondo", "Reading"] },
  { id: "taapsee_pannu", name: "Taapsee Pannu", gender: "female", age: 37, job: "Actress, Entrepreneur", location: "Delhi, India", bio: "Computer engineer turned fearless actress & sports team owner. Always ready for squash & espresso. 🏸☕🔥", interests: ["Squash", "Sports", "Women-Centric Cinema", "Travel"] },
  { id: "varun_dhawan", name: "Varun Dhawan", gender: "male", age: 37, job: "Actor", location: "Mumbai, India", bio: "High energy entertainer, fitness freak, and UFC follower. Always down for upbeat dance beats. 🕺🏋️‍♂️🍿", interests: ["Dance", "UFC", "Gym", "Cinema"] },
  { id: "bhumi_pednekar", name: "Bhumi Pednekar", gender: "female", age: 35, job: "Actress", location: "Mumbai, India", bio: "Climate champion and dedicated actor. Loving sustainable fashion & plant-forward meals. 🌿🎬👗", interests: ["Climate Action", "Cinema", "Fashion", "Nutrition"] },
  { id: "carryminati", name: "CarryMinati (Ajey Nagar)", gender: "male", age: 25, job: "YouTuber, Content Creator", location: "Faridabad, India", bio: "Toh kaise hain aap log? India's biggest individual YouTuber, hardcore gamer, and rap artist. 🎤🎮🔥", interests: ["Gaming", "Rap", "Roasting", "Anime"] },
  { id: "prajakta_koli", name: "Prajakta Koli", gender: "female", age: 31, job: "Content Creator, Actress", location: "Thane, India", bio: "Dum Dums assemble! Creating relatable sketches, acting in Mismatched, and drinking warm chai. ☕📖🎬", interests: ["Comedy", "Writing", "Chai", "Acting"] },
  { id: "ashish_chanchlani", name: "Ashish Chanchlani", gender: "male", age: 30, job: "YouTuber, Actor", location: "Ulhasnagar, India", bio: "Bijli giraane aaye hain! Making chaotic family comedy sketches, Marvel fanatic, and foodie. 🦸‍♂️🎬🍿", interests: ["Marvel", "Comedy Sketches", "Cinema", "Food"] },
  { id: "kusha_kapila", name: "Kusha Kapila", gender: "female", age: 35, job: "Content Creator, Actress", location: "Delhi, India", bio: "South Delhi parody queen turned mainstream actress. Big on witty banter & golden retriever energy. 💅🐕✨", interests: ["Satire", "Fashion", "Pets", "Cinema"] },
  { id: "sandeep_maheshwari", name: "Sandeep Maheshwari", gender: "male", age: 43, job: "Entrepreneur, Motivational Speaker", location: "Delhi, India", bio: "Aasaan Hai! Inspiring millions to live with courage, inner clarity, and purposeful action. 🧘‍♂️💡🌱", interests: ["Mindset", "Meditation", "Photography", "Philosophy"] },
  { id: "masoom_minawala", name: "Masoom Minawala", gender: "female", age: 31, job: "Fashion Influencer, Entrepreneur", location: "Mumbai, India", bio: "Championing Indian designers on global runways. Passionate about handlooms & business strategy. 👗💎🌍", interests: ["Haute Couture", "Indian Handlooms", "Business", "Travel"] },
  { id: "rishabh_pant", name: "Rishabh Pant", gender: "male", age: 26, job: "Cricketer", location: "Roorkee, India", bio: "Spiderman of Indian cricket! Fearless strokeplay, bouncing back stronger, and smiling always. 🏏🕷️🔥", interests: ["Cricket", "Gym", "Gaming", "Laughter"] },
  { id: "smriti_mandhana", name: "Smriti Mandhana", gender: "female", age: 28, job: "Cricketer", location: "Sangli, India", bio: "RCB & Indian cricket captain leading with timing and calm elegance. Gaming fan and coffee lover. 🏏🏆☕", interests: ["Cricket", "RCB Champion", "Music", "PlayStation"] },
  { id: "neeraj_chopra", name: "Neeraj Chopra", gender: "male", age: 26, job: "Olympic Athlete", location: "Panipat, India", bio: "Throwing javelins for Olympic Gold and World Championships. Proud Indian & disciplined athlete! 🥇🇮🇳⚡", interests: ["Javelin", "Olympics", "Haryana Culture", "Fitness"] }
];

// Rich conversation templates for each matched celebrity/developer
const CONVERSATIONS_DATA = [
  {
    personaId: "anushka_sharma",
    messages: [
      { sender: "them", text: "Hey! Saw your profile and loved your tech stack! 💻✨", minutesAgo: 180 },
      { sender: "me", text: "Hey Anushka! Thanks a lot, that means a lot coming from you! 🙌", minutesAgo: 170 },
      { sender: "them", text: "Are you more into backend engineering or fullstack architecture?", minutesAgo: 150 },
      { sender: "me", text: "Fullstack all the way! React + Node + Mongo is my daily vibe 🚀", minutesAgo: 140 },
      { sender: "them", text: "Awesome! We should totally grab a coffee and talk about creative projects ☕", minutesAgo: 15, unread: true }
    ]
  },
  {
    personaId: "rashmika_mandanna",
    messages: [
      { sender: "them", text: "Hiiiii! Matching with a developer is so exciting! 🌸✨", minutesAgo: 240 },
      { sender: "me", text: "Hey Rashmika! Haha welcome to DevMeet! How's your day going?", minutesAgo: 230 },
      { sender: "them", text: "Super busy shooting, but took a quick break to check my matches 🎬", minutesAgo: 200 },
      { sender: "them", type: "gif", mediaUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Q4eGg2Y3h2N2FkNjR3OXJvZ3J2bDJ1dG96MDFob2ZlZTNubHZwZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif", text: "GIF", minutesAgo: 195 },
      { sender: "me", text: "Haha love that GIF! Don't overwork yourself today 🌟", minutesAgo: 120 },
      { sender: "them", text: "Aww thank you! Are you free for a call later tonight? 📞", minutesAgo: 30, unread: true }
    ]
  },
  {
    personaId: "deepika_padukone",
    messages: [
      { sender: "them", text: "Hello! Really impressed by the UI design of this platform. Clean aesthetics! ✨", minutesAgo: 360 },
      { sender: "me", text: "Hi Deepika! Thank you so much, spent hours fine-tuning the dark mode theme! 🌙", minutesAgo: 340 },
      { sender: "them", text: "It really shows. Mindful design always stands out. Keep shining! 🤍", minutesAgo: 180, unread: true }
    ]
  },
  {
    personaId: "sara_ali_khan",
    messages: [
      { sender: "them", text: "Namaste! Knock knock, who's there? A match who writes clean code everywhere! 😂🙏", minutesAgo: 400 },
      { sender: "me", text: "Haha Sara your rhymes are unbeatable! 10/10 opening line 💯", minutesAgo: 380 },
      { sender: "them", text: "Hehe thank you! Trekking this weekend or deploying code? ⛰️💻", minutesAgo: 45, unread: true }
    ]
  },
  {
    personaId: "alia_bhatt",
    messages: [
      { sender: "them", text: "Hey there! Congratulations on the match! 🐾✨", minutesAgo: 500 },
      { sender: "me", text: "Hey Alia! Thanks, glad we connected! What's keeping you inspired lately?", minutesAgo: 480 },
      { sender: "them", text: "Storytelling, sustainable fashion, and lots of cat cuddles! 🐱", minutesAgo: 300 },
      { sender: "them", text: "What's the best tech idea you've had recently?", minutesAgo: 60, unread: true }
    ]
  },
  {
    personaId: "kiara_advani",
    messages: [
      { sender: "them", text: "Hi! Glad we matched on DevMeet. Hope you're having a productive week! 🤍", minutesAgo: 600 },
      { sender: "me", text: "Hi Kiara! Yes, building and shipping non-stop. Hope your shoots are going great!", minutesAgo: 550 },
      { sender: "them", text: "Yes, wrapped up today's schedule early! Let's catch up soon ✨", minutesAgo: 90, unread: true }
    ]
  },
  {
    personaId: "shraddha_kapoor",
    messages: [
      { sender: "them", text: "Hieee! Chai lover or coffee person while coding? ☕🌧️", minutesAgo: 700 },
      { sender: "me", text: "Always cutting chai during late night coding sessions! ☕", minutesAgo: 680 },
      { sender: "them", text: "Yes!! The only correct answer! High five ✋", minutesAgo: 110, unread: true }
    ]
  },
  {
    personaId: "kriti_sanon",
    messages: [
      { sender: "them", text: "Hey fellow engineer! Always great to see tech founders thriving 🚀", minutesAgo: 800 },
      { sender: "me", text: "Hey Kriti! Huge fan of what you built with Hyphen! 🌿", minutesAgo: 750 },
      { sender: "them", text: "Thank you so much! Let's exchange notes on scaling startups soon!", minutesAgo: 210 }
    ]
  },
  {
    personaId: "disha_patani",
    messages: [
      { sender: "them", text: "Hey! Quick question: Dragon Ball Z or Naruto? 🥋👀", minutesAgo: 900 },
      { sender: "me", text: "Dragon Ball Z all day! Goku's Ultra Instinct is unmatched 🔥", minutesAgo: 880 },
      { sender: "them", text: "YESSS! We are definitely going to be great friends! 🙌", minutesAgo: 320 }
    ]
  },
  {
    personaId: "virat_kohli",
    messages: [
      { sender: "them", text: "Top energy mate! Keep putting in the hard yards every single day! 💪🏏", minutesAgo: 1000 },
      { sender: "me", text: "Thanks Virat! Discipline is key in both coding and fitness 💥", minutesAgo: 950 },
      { sender: "them", text: "100%! Never compromise on the standard. Cheers! ⚡", minutesAgo: 450 }
    ]
  }
];

async function seed() {
  try {
    await dbConnect();
    console.log("Connected to MongoDB for rich chat & match seed...");

    // Find any existing non-admin user (e.g. user's own registered account)
    const existingUsers = await userModel.find({
      email: { $nin: personas.map(p => `${p.id}@devmeet.com`).concat(["admin@devmeet.com"]) }
    });

    console.log(`Found ${existingUsers.length} existing user account(s) to attach matches and chat history to.`);

    // Clear personas, connections, and messages to reseed cleanly
    await userModel.deleteMany({ email: { $in: personas.map(p => `${p.id}@devmeet.com`) } });
    await connectionModel.deleteMany({});
    await messageModel.deleteMany({});

    // Admin account
    let adminUser = await userModel.findOne({ email: "admin@devmeet.com" });
    if (!adminUser) {
      const adminHashed = await bcrypt.hash("Admin@12345", 10);
      adminUser = await userModel.create({
        firstName: "DevMeet",
        lastName: "SuperAdmin",
        email: "admin@devmeet.com",
        password: adminHashed,
        age: 30,
        gender: "female",
        role: "super-admin",
        phone: "9999999991",
        profileImage: "/profiles/anushka_sharma_1.jpg",
        photos: ["/profiles/anushka_sharma_1.jpg", "/profiles/anushka_sharma_2.jpg"],
        job: "Platform Super Administrator",
        location: "Mumbai, India",
        bio: "Super Admin account for DevMeet VIP Dating Platform",
        isVerified: true,
        verificationStatus: "approved",
        accountStatus: "active"
      });
    }

    // Default target users who will get the matches & chats:
    // If the user already registered an account, we use their account, PLUS admin, PLUS any existing account!
    const targetRecipients = [...existingUsers, adminUser];

    const hashedPw = await bcrypt.hash("Password@123", 10);
    const personaDocsMap = {};

    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      const photo1 = `/profiles/${p.id}_1.jpg`;
      const photo2 = `/profiles/${p.id}_2.jpg`;
      const photosArr = [photo1, photo2];
      if (p.has3 && fs.existsSync(path.join(frontendProfilesDir, `${p.id}_3.jpg`))) {
        photosArr.push(`/profiles/${p.id}_3.jpg`);
      }

      const nameParts = p.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || "Icon";

      const doc = await userModel.create({
        firstName,
        lastName,
        email: `${p.id}@devmeet.com`,
        password: hashedPw,
        age: p.age,
        gender: p.gender,
        phone: `98701${String(i + 1).padStart(5, '0')}`,
        location: p.location,
        job: p.job,
        bio: p.bio,
        interests: p.interests,
        profileImage: photo1,
        photos: photosArr,
        relationshipGoal: "long-term",
        isVerified: true,
        verificationStatus: "approved",
        accountStatus: "active",
        isOnline: i < 5 // First 5 online
      });

      personaDocsMap[p.id] = doc;
    }

    console.log(`Created ${personas.length} verified celebrity persona profiles.`);

    // Now for each target user in the system, connect them with the top personas and seed realistic chat messages!
    for (const recipient of targetRecipients) {
      console.log(`Seeding matches & conversations for user: ${recipient.firstName} (${recipient.email})...`);

      for (const conv of CONVERSATIONS_DATA) {
        const personaDoc = personaDocsMap[conv.personaId];
        if (!personaDoc) continue;

        // 1. Create Accepted Mutual Connection (Match)
        await connectionModel.create({
          fromUserId: personaDoc._id,
          toUserId: recipient._id,
          status: "accepted",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });

        // 2. Create Chronological Messages
        for (const msgData of conv.messages) {
          const isFromPersona = msgData.sender === "them";
          const senderId = isFromPersona ? personaDoc._id : recipient._id;
          const receiverId = isFromPersona ? recipient._id : personaDoc._id;
          const createdAt = new Date(Date.now() - (msgData.minutesAgo || 10) * 60 * 1000);

          await messageModel.create({
            senderId,
            receiverId,
            text: msgData.text || '',
            type: msgData.type || 'text',
            mediaUrl: msgData.mediaUrl || '',
            read: !msgData.unread,
            createdAt
          });
        }
      }

      // Also create 3 Pending Likes (Received requests) so the Likes tab in Feed is also rich!
      const pendingPersonas = ["avneet_kaur", "anushka_sen", "smriti_mandhana"];
      for (const pid of pendingPersonas) {
        const pdoc = personaDocsMap[pid];
        if (pdoc) {
          await connectionModel.create({
            fromUserId: pdoc._id,
            toUserId: recipient._id,
            status: "intrested",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
          });
        }
      }
    }

    console.log("=================================================");
    console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log(`✓ 45 Personas Created`);
    console.log(`✓ 10 Mutual Matches with full chat history per user`);
    console.log(`✓ Real-time test messages with GIFs, Icebreakers & unread counters`);
    console.log(`✓ 3 Incoming Likes / Requests in Feed`);
    console.log("=================================================");

    process.exit(0);
  } catch (e) {
    console.error("Seed error:", e);
    process.exit(1);
  }
}

seed();
