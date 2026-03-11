import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://udbhav4:vasudhaM100@cluster0.qcvpegg.mongodb.net/readr';

// Inline schemas to avoid module issues
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, default: 'student' }, classId: mongoose.Schema.Types.ObjectId,
  points: { type: Number, default: 0 }, streak: { type: Number, default: 0 },
  rank: { type: Number, default: 0 }, createdPuzzles: [], completedPuzzles: [],
  lastActive: Date,
}, { timestamps: true });

const ReadingSchema = new mongoose.Schema({
  title: String, professorName: String, subject: String, weekNumber: Number,
  readingTimeMinutes: Number, keyTermsCount: Number, summaryContent: String,
  coreConcepts: [{ title: String, description: String, citation: String }],
  keyTheorists: [{ name: String, contribution: String }],
  pdfUrl: String, createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const ClassSchema = new mongoose.Schema({
  name: String, subject: String, professorId: mongoose.Schema.Types.ObjectId, students: [],
}, { timestamps: true });

const PuzzleSchema = new mongoose.Schema({
  title: String, readingMaterialId: mongoose.Schema.Types.ObjectId,
  createdBy: mongoose.Schema.Types.ObjectId, assignedTo: mongoose.Schema.Types.ObjectId,
  puzzleType: String, solutionWord: String, clue: String,
  maxAttempts: Number, dateActive: Date,
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const ReadingMaterial = mongoose.models.ReadingMaterial || mongoose.model('ReadingMaterial', ReadingSchema);
  const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
  const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

  // Clear existing data
  await Promise.all([User.deleteMany({}), ReadingMaterial.deleteMany({}), Class.deleteMany({}), Puzzle.deleteMany({})]);
  console.log('Cleared existing data');

  // Create professor
  const profPassword = await bcrypt.hash('professor123', 12);
  const professor = await User.create({
    name: 'Prof. S. Pillai', email: 'pillai@university.edu', password: profPassword,
    role: 'professor', points: 0, streak: 0,
  });

  // Create students
  const studentPassword = await bcrypt.hash('student123', 12);
  const studentData = [
    { name: 'Riya Sharma', email: 'riya@university.edu', points: 310, streak: 4, rank: 7 },
    { name: 'Rohan Kumar', email: 'rohan@university.edu', points: 480, streak: 11, rank: 1 },
    { name: 'Priya Mehta', email: 'priya@university.edu', points: 460, streak: 18, rank: 2 },
    { name: 'Sneha Reddy', email: 'sneha@university.edu', points: 410, streak: 9, rank: 3 },
    { name: 'Vikram Tiwari', email: 'vikram@university.edu', points: 390, streak: 11, rank: 4 },
    { name: 'Meera Joshi', email: 'meera@university.edu', points: 360, streak: 9, rank: 5 },
    { name: 'Arjun Singh', email: 'arjun@university.edu', points: 325, streak: 3, rank: 6 },
  ];
  const students = await Promise.all(
    studentData.map(s => User.create({ ...s, email: s.email.toLowerCase(), password: studentPassword, role: 'student' }))
  );
  console.log(`Created ${students.length} students`);

  // Create class
  const cls = await Class.create({
    name: 'Behavioural Sciences 2024',
    subject: 'Behavioural Sciences',
    professorId: professor._id,
    students: students.map(s => s._id),
  });

  // Assign class to all students
  await User.updateMany({ role: 'student' }, { classId: cls._id });
  console.log('Created class');

  // Create reading materials from the content pack
  const readings = await ReadingMaterial.insertMany([
    {
      title: 'Agenda-Setting & Framing Theory',
      professorName: 'Prof. S. Pillai',
      subject: 'Behavioural Sciences',
      weekNumber: 3,
      readingTimeMinutes: 8,
      keyTermsCount: 5,
      summaryContent: 'Agenda-setting, framing, priming, salience transfer, and second-level agenda-setting.',
      coreConcepts: [
        { title: 'Agenda-setting', description: "media doesn't tell us what to think, but what to think about — repeated coverage elevates an issue's perceived importance", citation: 'McCombs & Shaw, 1972' },
        { title: 'Framing', description: 'how a story is packaged shapes interpretation — the same event framed as a "crime wave" vs. a "policing crisis" produces different audience responses', citation: 'Entman, 1993' },
        { title: 'Priming', description: 'repeated exposure to certain themes activates those mental schemas when audiences evaluate related issues', citation: '' },
        { title: 'Salience transfer', description: 'the prominence given to issues in media directly transfers to the public\'s perception of those issues\' importance', citation: '' },
        { title: 'Second-level agenda-setting', description: 'beyond what to think about, media also shapes which attributes of an issue are emphasised', citation: '' },
      ],
      keyTheorists: [
        { name: 'McCombs & Shaw', contribution: '1968 election study; media salience predicts public salience' },
        { name: 'Iyengar & Kinder', contribution: 'experimental evidence for priming via TV news' },
        { name: 'Entman', contribution: 'formalised four functions of framing: define, diagnose, evaluate, remedy' },
      ],
      createdBy: professor._id,
    },
    {
      title: 'Present Bias & Behavioural Economics',
      professorName: 'Prof. S. Pillai',
      subject: 'Behavioural Sciences',
      weekNumber: 5,
      readingTimeMinutes: 10,
      keyTermsCount: 5,
      summaryContent: 'Present bias, hyperbolic discounting, naive vs sophisticated agents, pre-commitment, and temporal inconsistency.',
      coreConcepts: [
        { title: 'Present bias', description: 'the tendency to overweight immediate costs and benefits relative to future ones', citation: "O'Donoghue & Rabin, 1999" },
        { title: 'Hyperbolic discounting', description: 'a steep discount applied to future outcomes that makes procrastination feel rational at every individual moment', citation: '' },
        { title: 'Naive vs. sophisticated agent', description: 'a naive agent underestimates their own bias; a sophisticated agent knows they are biased but may still fail', citation: '' },
        { title: 'Pre-commitment', description: 'voluntarily restricting future choices to override anticipated self-control failure', citation: '' },
        { title: 'Temporal inconsistency', description: 'preferences shift depending on when you are actually evaluating them', citation: '' },
      ],
      keyTheorists: [
        { name: "O'Donoghue & Rabin", contribution: '1999 AER paper formally modelling procrastination and present bias' },
        { name: 'Thaler', contribution: 'mental accounting and self-control problems in economic decisions' },
      ],
      createdBy: professor._id,
    },
    {
      title: 'Social Proof & Norms',
      professorName: 'Prof. S. Pillai',
      subject: 'Behavioural Sciences',
      weekNumber: 7,
      readingTimeMinutes: 9,
      keyTermsCount: 5,
      summaryContent: 'Social proof, descriptive norms, injunctive norms, pluralistic ignorance, and social comparison.',
      coreConcepts: [
        { title: 'Social proof', description: "under uncertainty, people look to others' behaviour as evidence of what is correct", citation: 'Cialdini, 2001' },
        { title: 'Descriptive norms', description: "what most people actually do — e.g. 'Most students complete their reading by 9pm.'", citation: '' },
        { title: 'Injunctive norms', description: 'what people are expected or supposed to do — based on moral approval rather than statistical frequency', citation: '' },
        { title: 'Pluralistic ignorance', description: 'when members of a group privately reject a norm but publicly conform, each assuming they are the minority', citation: '' },
        { title: 'Social comparison', description: "we evaluate our own opinions and abilities by benchmarking against similar others", citation: 'Festinger, 1954' },
      ],
      keyTheorists: [
        { name: 'Cialdini', contribution: 'identified six principles of influence: social proof, reciprocity, commitment, authority, liking, and scarcity' },
        { name: 'Festinger', contribution: 'social comparison theory and cognitive dissonance' },
      ],
      createdBy: professor._id,
    },
    {
      title: 'Gamification & Motivation',
      professorName: 'Prof. S. Pillai',
      subject: 'Behavioural Sciences',
      weekNumber: 9,
      readingTimeMinutes: 8,
      keyTermsCount: 5,
      summaryContent: 'Gamification, intrinsic vs extrinsic motivation, variable reward schedules, generation effect, and flow state.',
      coreConcepts: [
        { title: 'Gamification', description: 'the application of game-design elements to non-game contexts to increase engagement and motivation', citation: 'Hamuddin et al., 2024' },
        { title: 'Intrinsic vs. extrinsic motivation', description: 'intrinsic motivation comes from within; extrinsic is driven by external rewards. Over-reliance on extrinsic rewards can crowd out intrinsic motivation (the overjustification effect)', citation: '' },
        { title: 'Variable reward schedule', description: 'rewards delivered at unpredictable intervals produce stronger and more persistent behaviour than fixed schedules', citation: '' },
        { title: 'Generation effect', description: 'actively generating information makes a learner retain it significantly better than passively consuming it', citation: '' },
        { title: 'Flow state', description: "total absorption in a task — achieved when challenge level is appropriately calibrated to skill level", citation: 'Csikszentmihalyi' },
      ],
      keyTheorists: [
        { name: 'Csikszentmihalyi', contribution: 'flow theory — optimal experience through challenge-skill balance' },
        { name: 'Deci & Ryan', contribution: 'self-determination theory: autonomy, competence, and relatedness drive intrinsic motivation' },
      ],
      createdBy: professor._id,
    },
  ]);
  console.log(`Created ${readings.length} reading materials`);

  // Create sample puzzles from the content pack
  const puzzleData = [
    { title: 'Guess the concept', readingIdx: 0, creator: 1, assignee: 0, word: 'AGENDA', clue: '"Media doesn\'t tell you what to think — just what to think about. This theory names that effect."', maxAttempts: 6 },
    { title: 'Name the technique', readingIdx: 0, creator: 2, assignee: 1, word: 'FRAMING', clue: '"The same event, packaged differently. \'Benefit fraud\' vs. \'poverty crisis\' — same facts, opposite effect. This is the technique."', maxAttempts: 6 },
    { title: 'Present ___', readingIdx: 1, creator: 3, assignee: 2, word: 'BIAS', clue: '"The \'present\' version of this affects how we weigh immediate comfort against future benefit. It\'s why the reading never gets done."', maxAttempts: 6 },
    { title: 'Key principle', readingIdx: 2, creator: 4, assignee: 3, word: 'NORMS', clue: '"The invisible rules that govern behaviour in groups. Descriptive ones tell you what people do; injunctive ones tell you what should be done."', maxAttempts: 6 },
    { title: 'Total absorption', readingIdx: 3, creator: 5, assignee: 4, word: 'FLOW', clue: '"Csikszentmihalyi\'s term for total absorption in a task that is challenging but achievable. The opposite of boredom and anxiety simultaneously."', maxAttempts: 6 },
  ];

  const puzzles = await Promise.all(
    puzzleData.map(p => Puzzle.create({
      title: p.title,
      readingMaterialId: readings[p.readingIdx]._id,
      createdBy: students[p.creator]._id,
      assignedTo: students[p.assignee]._id,
      puzzleType: 'wordle',
      solutionWord: p.word,
      clue: p.clue,
      maxAttempts: p.maxAttempts,
      dateActive: new Date(),
    }))
  );
  console.log(`Created ${puzzles.length} puzzles`);

  await mongoose.disconnect();
  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('Student: riya@university.edu / student123');
  console.log('Student: rohan@university.edu / student123');
  console.log('Professor: pillai@university.edu / professor123');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
