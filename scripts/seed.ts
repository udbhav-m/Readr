import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  "mongodb+srv://udbhav4:udbhav@cluster0.qcvpegg.mongodb.net/readr";

// Inline schemas to avoid module issues
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "student" },
    classId: mongoose.Schema.Types.ObjectId,
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    createdPuzzles: [],
    completedPuzzles: [],
    lastActive: Date,
  },
  { timestamps: true },
);

const ReadingSchema = new mongoose.Schema(
  {
    title: String,
    professorName: String,
    subject: String,
    weekNumber: Number,
    readingTimeMinutes: Number,
    keyTermsCount: Number,
    summaryContent: String,
    coreConcepts: [{ title: String, description: String, citation: String }],
    keyTheorists: [{ name: String, contribution: String }],
    fullContent: [{ heading: String, body: String }],
    pdfUrl: String,
    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

const ClassSchema = new mongoose.Schema(
  {
    name: String,
    subject: String,
    professorId: mongoose.Schema.Types.ObjectId,
    students: [],
  },
  { timestamps: true },
);

const PuzzleSchema = new mongoose.Schema(
  {
    title: String,
    readingMaterialId: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId,
    assignedTo: mongoose.Schema.Types.ObjectId,
    puzzleType: String,
    solutionWord: String,
    clue: String,
    maxAttempts: Number,
    dateActive: Date,
  },
  { timestamps: true },
);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const ReadingMaterial =
    mongoose.models.ReadingMaterial ||
    mongoose.model("ReadingMaterial", ReadingSchema);
  const Class = mongoose.models.Class || mongoose.model("Class", ClassSchema);
  const Puzzle =
    mongoose.models.Puzzle || mongoose.model("Puzzle", PuzzleSchema);

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    ReadingMaterial.deleteMany({}),
    Class.deleteMany({}),
    Puzzle.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create professor
  const profPassword = await bcrypt.hash("professor123", 12);
  const professor = await User.create({
    name: "Prof. S. Pillai",
    email: "pillai@university.edu",
    password: profPassword,
    role: "professor",
    points: 0,
    streak: 0,
  });

  // Create students
  const studentPassword = await bcrypt.hash("student123", 12);
  const studentData = [
    {
      name: "Riya Sharma",
      email: "riya@university.edu",
      points: 310,
      streak: 4,
      rank: 7,
    },
    {
      name: "Rohan Kumar",
      email: "rohan@university.edu",
      points: 480,
      streak: 11,
      rank: 1,
    },
    {
      name: "Priya Mehta",
      email: "priya@university.edu",
      points: 460,
      streak: 18,
      rank: 2,
    },
    {
      name: "Sneha Reddy",
      email: "sneha@university.edu",
      points: 410,
      streak: 9,
      rank: 3,
    },
    {
      name: "Vikram Tiwari",
      email: "vikram@university.edu",
      points: 390,
      streak: 11,
      rank: 4,
    },
    {
      name: "Meera Joshi",
      email: "meera@university.edu",
      points: 360,
      streak: 9,
      rank: 5,
    },
    {
      name: "Arjun Singh",
      email: "arjun@university.edu",
      points: 325,
      streak: 3,
      rank: 6,
    },
  ];
  const students = await Promise.all(
    studentData.map((s) =>
      User.create({
        ...s,
        email: s.email.toLowerCase(),
        password: studentPassword,
        role: "student",
      }),
    ),
  );
  console.log(`Created ${students.length} students`);

  // Create class
  const cls = await Class.create({
    name: "Behavioural Sciences 2024",
    subject: "Behavioural Sciences",
    professorId: professor._id,
    students: students.map((s) => s._id),
  });

  // Assign class to all students
  await User.updateMany({ role: "student" }, { classId: cls._id });
  console.log("Created class");

  // Create reading materials from the content pack
  const readings = await ReadingMaterial.insertMany([
    {
      title: "Agenda-Setting & Framing Theory",
      professorName: "Prof. S. Pillai",
      subject: "Behavioural Sciences",
      weekNumber: 3,
      readingTimeMinutes: 8,
      keyTermsCount: 5,
      summaryContent:
        "Agenda-setting, framing, priming, salience transfer, and second-level agenda-setting.",
      coreConcepts: [
        {
          title: "Agenda-setting",
          description:
            "media doesn't tell us what to think, but what to think about — repeated coverage elevates an issue's perceived importance",
          citation: "McCombs & Shaw, 1972",
        },
        {
          title: "Framing",
          description:
            'how a story is packaged shapes interpretation — the same event framed as a "crime wave" vs. a "policing crisis" produces different audience responses',
          citation: "Entman, 1993",
        },
        {
          title: "Priming",
          description:
            "repeated exposure to certain themes activates those mental schemas when audiences evaluate related issues",
          citation: "",
        },
        {
          title: "Salience transfer",
          description:
            "the prominence given to issues in media directly transfers to the public's perception of those issues' importance",
          citation: "",
        },
        {
          title: "Second-level agenda-setting",
          description:
            "beyond what to think about, media also shapes which attributes of an issue are emphasised",
          citation: "",
        },
      ],
      keyTheorists: [
        {
          name: "McCombs & Shaw",
          contribution:
            "1968 election study; media salience predicts public salience",
        },
        {
          name: "Iyengar & Kinder",
          contribution: "experimental evidence for priming via TV news",
        },
        {
          name: "Entman",
          contribution:
            "formalised four functions of framing: define, diagnose, evaluate, remedy",
        },
      ],
      fullContent: [
        {
          heading: "Introduction",
          body: "One of the most durable ideas in media studies is that journalists and editors do not simply report the world \u2014 they shape how we perceive it. This shaping does not necessarily mean distortion or bias in the colloquial sense. Rather, it refers to a more fundamental process: the act of deciding which issues, events, and attributes receive attention and which do not. This process is what researchers have come to describe under two related but distinct concepts \u2014 agenda-setting and framing.\n\nUnderstanding both is essential for anyone working in or studying media, communication, and behaviour change. The two theories together explain not only what people think about, but how they think about it \u2014 and that distinction has significant implications for everything from political communication to public health campaigns to app design.",
        },
        {
          heading: "Agenda-Setting: What to Think About",
          body: "The foundational study of agenda-setting was conducted by Maxwell McCombs and Donald Shaw during the 1968 US presidential election. McCombs and Shaw surveyed undecided voters in Chapel Hill, North Carolina, and compared their issue priorities with the volume of news coverage each issue received across local and national media outlets. Their finding was striking: the issues voters considered most important closely mirrored those given the most prominent coverage in the press, regardless of the voters\u2019 own party affiliations or prior attitudes.\n\nFrom this observation, McCombs and Shaw proposed what became known as the agenda-setting hypothesis: the media may not tell us what to think, but they are highly successful in telling us what to think about. The term \u2018agenda\u2019 here refers to the list of issues that are treated as important \u2014 and the claim is that the media\u2019s agenda transfers, with considerable reliability, to the public\u2019s agenda.\n\nSalience is the key mechanism. When a story is given prominent placement \u2014 front page, top of the bulletin, high in a social media feed \u2014 it registers as important, regardless of its objective significance. Conversely, issues that receive little coverage become invisible to the public even if they have substantial real-world impact. This is what researchers call the salience transfer process: the prominence assigned to issues by the media maps, with measurable regularity, onto the perceived importance assigned to those issues by the public.\n\nImportantly, agenda-setting theorists are careful to distinguish their claim from older, more powerful models of media influence. They are not arguing that media directly changes what people believe or how they vote. The claim is narrower and, in some ways, more insidious: media shapes the terrain on which beliefs and decisions are formed, by determining which issues are in the room and which are not.",
        },
        {
          heading: "Second-Level Agenda-Setting",
          body: "The original agenda-setting hypothesis concerned issue salience \u2014 which topics make it onto the public radar. Subsequent research extended this to what is called second-level agenda-setting, which concerns attribute salience. Not only do media determine which issues we discuss, they also shape which features or dimensions of those issues we consider.\n\nFor example, coverage of immigration might emphasise economic dimensions (costs and benefits to the labour market), or it might foreground security dimensions (border control, crime statistics). Both framings concern the same issue, but the attribute each makes salient leads audiences toward very different evaluative conclusions. This is where agenda-setting begins to shade into its close relative: framing theory.",
        },
        {
          heading: "Framing Theory: How to Think About It",
          body: "While agenda-setting tells us that media influence what issues we attend to, framing theory addresses how those issues are presented and interpreted. The concept of framing originates in the sociological work of Erving Goffman (1974), who used the term to describe the interpretive schemas that people use to make sense of events.\n\nRobert Entman (1993) offered the most widely cited definition of framing in media studies. For Entman, to frame is to select some aspects of a perceived reality and make them more salient in a communicating text, in such a way as to promote a particular problem definition, causal interpretation, moral evaluation, and/or treatment recommendation. This definition identifies four functions that frames perform: they define what the problem is, they diagnose causes, they make moral judgements, and they suggest remedies.\n\nA classic illustration is the difference between covering knife crime as a law enforcement problem (requiring more police and harsher sentences) versus covering it as a public health problem (requiring community intervention, mental health support, and poverty reduction). The underlying events are identical. The frames are not \u2014 and the frames carry very different implications for policy, public attitude, and resource allocation.",
        },
        {
          heading: "The Framing of Everyday Issues",
          body: "Framing is not limited to dramatic political controversies. It operates on everyday reporting in ways that are easy to overlook precisely because they feel natural. Economic coverage routinely frames markets as having moods \u2014 they are \u2018nervous\u2019, \u2018bullish\u2019, or \u2018spooked\u2019 \u2014 a personification that subtly implies markets have inherent logic that humans must adapt to, rather than structures that humans design and could redesign. Health reporting frequently frames illness in military metaphors \u2014 patients \u2018battle\u2019 cancer, \u2018fight\u2019 infection, \u2018lose\u2019 their struggle \u2014 a framing that, research suggests, can affect how patients understand their own agency and their relationship with medical systems.\n\nThese frames are powerful because they operate below the level of explicit argument. A reader does not consciously register that they are being presented with one frame among many possible alternatives. The frame appears as the story itself.",
        },
        {
          heading: "Priming: The Downstream Effect",
          body: "Related to both agenda-setting and framing is the concept of priming. If agenda-setting tells us which issues are prominent and framing tells us how to interpret them, priming describes what happens when those prominent, framed issues are later used as mental benchmarks for evaluating other things.\n\nIyengar and Kinder (1987) demonstrated this experimentally using television news. Participants who were exposed to heavy coverage of a particular policy issue \u2014 say, national defence \u2014 subsequently used defence as a primary criterion for evaluating the overall performance of the president, even when asked about something else entirely. The issue that had been made salient by the media became the lens through which other judgements were filtered.\n\nPriming has significant implications for political communication. Parties and campaigns routinely attempt to keep certain issues prominent in media coverage precisely because they know that prominence affects which criteria voters use when making their evaluations. To shift the agenda is, in effect, to shift the terms of the entire debate.",
        },
        {
          heading: "Agenda-Setting in the Digital Age",
          body: "The original agenda-setting research was conducted in an environment dominated by a small number of major broadcast and print outlets. The digital media landscape has complicated the picture considerably. Social media platforms do not have editors in the traditional sense, but they have algorithms \u2014 and those algorithms perform an agenda-setting function that is arguably more powerful than any individual editor, operating at a scale that is effectively global and at a speed that is effectively instantaneous.\n\nResearch has documented a phenomenon sometimes called intermedia agenda-setting, in which the agendas of different media outlets influence each other. Traditional news organisations respond to what is trending on social media; social media users amplify stories from traditional outlets; influencers and viral content set agendas that institutional media then cover. The result is a complex, iterative system in which it is increasingly difficult to identify a single source of agenda-setting power.\n\nWhat has not changed is the underlying dynamic: some issues become salient and others do not, some frames for understanding those issues circulate widely and others do not, and these patterns of salience and framing have measurable effects on public perception and behaviour.",
        },
        {
          heading: "Summary",
          body: "Agenda-setting and framing are two of the most empirically robust and theoretically influential concepts in media studies. Agenda-setting tells us that media do not reflect public priorities \u2014 they help constitute them, by determining which issues receive the attention that generates salience. Framing tells us that the same issue can be presented in ways that lead audiences toward very different interpretations, through the selective emphasis of certain attributes, causes, and remedies. Priming shows that the issues made prominent by media coverage become the criteria by which audiences subsequently evaluate other, related things.\n\nTogether, these three concepts describe a media environment that shapes thought not through direct persuasion but through the more subtle, pervasive process of setting the terms of public discourse.",
        },
      ],
      createdBy: professor._id,
    },
    {
      title: "Present Bias & Behavioural Economics",
      professorName: "Prof. S. Pillai",
      subject: "Behavioural Sciences",
      weekNumber: 5,
      readingTimeMinutes: 10,
      keyTermsCount: 5,
      summaryContent:
        "Present bias, hyperbolic discounting, naive vs sophisticated agents, pre-commitment, and temporal inconsistency.",
      coreConcepts: [
        {
          title: "Present bias",
          description:
            "the tendency to overweight immediate costs and benefits relative to future ones",
          citation: "O'Donoghue & Rabin, 1999",
        },
        {
          title: "Hyperbolic discounting",
          description:
            "a steep discount applied to future outcomes that makes procrastination feel rational at every individual moment",
          citation: "",
        },
        {
          title: "Naive vs. sophisticated agent",
          description:
            "a naive agent underestimates their own bias; a sophisticated agent knows they are biased but may still fail",
          citation: "",
        },
        {
          title: "Pre-commitment",
          description:
            "voluntarily restricting future choices to override anticipated self-control failure",
          citation: "",
        },
        {
          title: "Temporal inconsistency",
          description:
            "preferences shift depending on when you are actually evaluating them",
          citation: "",
        },
      ],
      keyTheorists: [
        {
          name: "O'Donoghue & Rabin",
          contribution:
            "1999 AER paper formally modelling procrastination and present bias",
        },
        {
          name: "Thaler",
          contribution:
            "mental accounting and self-control problems in economic decisions",
        },
      ],
      fullContent: [
        {
          heading: "Introduction",
          body: "Classical economics rests on an assumption about human beings that turns out, on inspection, to be deeply problematic: that people are rational agents who make consistent decisions in pursuit of their long-term interests. This model \u2014 sometimes called Homo economicus \u2014 predicts that people will save adequately for retirement, take their medication as prescribed, exercise regularly, and read their lecture materials before class.\n\nThe fact that people systematically fail to do these things, even when they genuinely want to and know they should, is not a failure of character or willpower in any meaningful sense. It reflects instead the operation of cognitive and motivational processes that deviate, in predictable ways, from the classical rational agent model. Behavioural economics is the field that studies these deviations \u2014 and one of the most powerful and well-documented of them is present bias.",
        },
        {
          heading: "What is Present Bias?",
          body: "Present bias refers to the tendency to place disproportionate weight on immediate outcomes relative to future ones. It is not simply impatience \u2014 though it is related to it. The crucial feature of present bias is that it produces time-inconsistent preferences: what we choose when the future is distant differs from what we choose when that future arrives and becomes the present.\n\nO\u2019Donoghue and Rabin (1999) formalised this insight in a highly influential paper in the American Economic Review. They modelled present bias using what is called a quasi-hyperbolic discounting function, which captures the finding that people apply a steep discount to anything that requires effort or sacrifice now, but a much shallower discount to costs and benefits that lie in the future.\n\nA simple example illustrates this. Suppose someone is asked on Monday whether they would prefer to do a mildly unpleasant task on Wednesday or a slightly more unpleasant task on Thursday. Many people choose Wednesday. But when Wednesday actually arrives, the calculation changes: the cost of doing the task now is felt acutely, and Thursday suddenly seems very appealing. The future-oriented self and the present-oriented self want different things, and the present-oriented self has control of the body.",
        },
        {
          heading: "Hyperbolic vs. Exponential Discounting",
          body: "The standard economic model assumes that people discount future outcomes at a constant rate over time \u2014 this is called exponential discounting. Under exponential discounting, preferences are consistent: if you prefer X to Y at a future date, you will still prefer X to Y when that date arrives.\n\nThe empirical evidence, however, strongly supports a different model: hyperbolic discounting, in which the discount rate is steepest for outcomes in the near future and flattens out for outcomes that are further away. This creates the characteristic present bias pattern \u2014 a powerful pull toward immediate gratification that weakens as the outcome moves into the distance.\n\nThe practical consequence is procrastination. The reading that feels too effortful to begin this evening will feel exactly as effortful tomorrow evening, and the evening after that. The future self who will presumably do the reading is perpetually just around the corner but never quite arrives, because each present self faces the same immediate cost and the same temptation to defer.",
        },
        {
          heading: "Na\u00effs and Sophisticates",
          body: "O\u2019Donoghue and Rabin make a further distinction that is particularly useful: between na\u00effs and sophisticates. A na\u00eff is someone who has present bias but does not know it \u2014 or at least, does not correctly anticipate how it will affect future behaviour. The na\u00eff genuinely believes, on Monday, that they will do the reading on Wednesday. They are not lying or making excuses. They simply have an inaccurate model of their own future preferences.\n\nA sophisticate, by contrast, knows they have present bias and can anticipate that their future self will behave in biased ways. This knowledge can lead to more effective self-management \u2014 but it does not automatically solve the problem.\n\nIn practice, most people fall somewhere between these poles: they have some awareness of their tendency to procrastinate, but systematically underestimate how strong the pull of the present will be when it actually arrives.",
        },
        {
          heading: "Pre-commitment as a Solution",
          body: "If present bias creates a conflict between our present and future selves, one solution is to bind the future self in advance \u2014 to make it harder or impossible to make the choice that present bias would otherwise produce. This is the logic of pre-commitment, which has a long literary history: Ulysses having himself tied to the mast so that he can hear the Sirens without being able to act on the impulse they create is the canonical example.\n\nPre-commitment devices take many forms in everyday life. Signing up for a gym class in advance (and paying a cancellation fee) makes it more costly to stay home. Setting money aside in a pension fund that cannot be easily accessed removes the temptation to spend it. Telling a colleague you will have a draft ready by Friday creates a social cost for missing the deadline.\n\nThe insight from O\u2019Donoghue and Rabin is that pre-commitment is most valuable for na\u00effs, because sophisticates may already be implementing it. But even sophisticates can benefit from stronger commitment mechanisms, particularly when the temptation of the present is especially powerful.",
        },
        {
          heading: "Implications for Behaviour Change Design",
          body: "Present bias is not a pathology to be treated \u2014 it is a feature of human cognition that any serious behaviour change intervention must account for. Telling people what they should do, and even explaining why it is in their interest to do it, is insufficient if the design of the intervention does not address the immediate cost that present bias makes feel overwhelming.\n\nEffective behaviour change design therefore tends to focus on reducing the immediate cost of the desired behaviour (reducing friction), increasing the immediate reward for it (immediate positive feedback, social recognition, streaks), and making the cost of inaction more visible and immediate (social comparison, reminders of what others are doing).\n\nThese design principles \u2014 reduce friction, increase immediate reward, make inaction costly \u2014 are not tricks or manipulations. They are rational responses to a well-documented feature of human motivation.",
        },
        {
          heading: "Summary",
          body: "Present bias is the tendency to overweight immediate costs and benefits relative to future ones, producing preferences that shift over time in ways that are internally inconsistent. It is captured formally by the quasi-hyperbolic discounting model and explains the gap between what people plan to do and what they actually do. The distinction between na\u00effs and sophisticates helps predict who will self-correct and who will need external commitment devices. Pre-commitment \u2014 voluntarily constraining future choices \u2014 is the most direct behavioural solution, but effective behaviour change design must also attend to friction, immediate reward, and the visibility of inaction\u2019s costs.",
        },
      ],
      createdBy: professor._id,
    },
    {
      title: "Social Proof & Norms",
      professorName: "Prof. S. Pillai",
      subject: "Behavioural Sciences",
      weekNumber: 7,
      readingTimeMinutes: 9,
      keyTermsCount: 5,
      summaryContent:
        "Social proof, descriptive norms, injunctive norms, pluralistic ignorance, and social comparison.",
      coreConcepts: [
        {
          title: "Social proof",
          description:
            "under uncertainty, people look to others' behaviour as evidence of what is correct",
          citation: "Cialdini, 2001",
        },
        {
          title: "Descriptive norms",
          description:
            "what most people actually do — e.g. 'Most students complete their reading by 9pm.'",
          citation: "",
        },
        {
          title: "Injunctive norms",
          description:
            "what people are expected or supposed to do — based on moral approval rather than statistical frequency",
          citation: "",
        },
        {
          title: "Pluralistic ignorance",
          description:
            "when members of a group privately reject a norm but publicly conform, each assuming they are the minority",
          citation: "",
        },
        {
          title: "Social comparison",
          description:
            "we evaluate our own opinions and abilities by benchmarking against similar others",
          citation: "Festinger, 1954",
        },
      ],
      keyTheorists: [
        {
          name: "Cialdini",
          contribution:
            "identified six principles of influence: social proof, reciprocity, commitment, authority, liking, and scarcity",
        },
        {
          name: "Festinger",
          contribution: "social comparison theory and cognitive dissonance",
        },
      ],
      fullContent: [
        {
          heading: "Introduction",
          body: "Human beings are fundamentally social. Our beliefs, attitudes, and behaviours are shaped not only by personal experience and rational deliberation, but by continuous observation of and reference to what other people do and think. This is not a weakness \u2014 it is an adaptive response to the complexity of the social world. When we are uncertain about what to do, looking to what others do is often an efficient and reliable guide.\n\nThe systematic study of this tendency goes under several names: social influence, conformity, normative behaviour, and \u2014 in the influential framework developed by Robert Cialdini \u2014 social proof. Understanding how social influence operates is essential for anyone studying behaviour change, communication, or the design of systems intended to shift what people do.",
        },
        {
          heading: "Social Proof: The Principle",
          body: "Robert Cialdini (2001) identified social proof as one of six universal principles of influence in his landmark book Influence: The Psychology of Persuasion. The principle holds that, under conditions of uncertainty, people look to the behaviour of others as evidence of what the correct course of action is. The greater the number of people observed to be doing something, and the more similar those people are to the observer, the more powerful the social proof effect.\n\nCialdini\u2019s examples range from the trivial (laugh tracks on television make people find shows funnier) to the life-and-death (suicides increase following prominent news coverage of suicides \u2014 the so-called Werther effect). In both cases, the mechanism is the same: observing that other people have done something updates the observer\u2019s sense of what is normal, appropriate, or desirable, and this update shifts their own behaviour accordingly.\n\nThe key word in Cialdini\u2019s formulation is uncertainty. Social proof is most powerful when people do not have strong prior information or clear personal preferences to rely on.",
        },
        {
          heading: "Descriptive and Injunctive Norms",
          body: "Social psychologists make a distinction that is critical for understanding how social influence works in practice: between descriptive norms and injunctive norms.\n\nDescriptive norms describe what people actually do \u2014 the statistical regularity of behaviour in a group. \u2018Most students in this course read the assigned material before class\u2019 is a descriptive norm statement. It tells you about behaviour, not about what is right or approved.\n\nInjunctive norms describe what people are expected or supposed to do \u2014 the moral standards of a group. \u2018You should read the material before class\u2019 is an injunctive norm statement. It conveys approval and disapproval rather than frequency.\n\nBoth types of norm influence behaviour, but through different mechanisms. Descriptive norms work through social proof \u2014 they tell you what is common, and common behaviour feels safe and appropriate. Injunctive norms work through social approval and disapproval \u2014 they tell you what is valued, and violating valued norms carries social costs.\n\nImportantly, descriptive and injunctive norms can conflict \u2014 and when they do, this conflict can produce counterproductive effects. If a public health campaign says \u2018Drunk driving is a major problem in our community\u2019 but also implies that many people do it, the descriptive norm can actually normalise the behaviour it was intended to condemn.",
        },
        {
          heading: "Pluralistic Ignorance",
          body: "One of the most interesting and practically important phenomena in the social norms literature is pluralistic ignorance: the situation in which most members of a group privately reject a norm or behaviour, but publicly comply with it because they incorrectly believe that others accept it.\n\nThe classic demonstration comes from studies of alcohol consumption among university students. Many students drink more than they personally want to, because they believe that heavy drinking is the norm among their peers. In reality, surveys consistently show that most students drink less than they think others do and are less comfortable with heavy drinking than they assume their peers to be. Everyone is conforming to a norm that almost nobody actually holds, because everyone is looking at public behaviour rather than private attitudes.\n\nPluralistic ignorance is particularly relevant to academic reading behaviour. It is plausible that many students skip pre-class readings partly because they assume that not reading is what everyone does. If the private reality were made visible, the social proof dynamic could shift dramatically.",
        },
        {
          heading: "Social Comparison Theory",
          body: "Leon Festinger\u2019s Social Comparison Theory (1954) provides the psychological foundation for understanding why social proof is so motivating. Festinger proposed that people have a fundamental drive to evaluate their own opinions and abilities, and that in the absence of objective standards, they do so by comparing themselves to others \u2014 particularly others who are similar to themselves.\n\nSocial comparison can be upward (comparing oneself to someone who is doing better, which can be motivating or demoralising depending on the context) or downward (comparing oneself to someone doing worse, which tends to boost self-esteem but can also reduce effort). The design of social comparison environments \u2014 including leaderboards, peer rankings, and visible streaks \u2014 matters enormously for which direction the comparison points and what effect it produces.\n\nResearch in educational contexts suggests that upward social comparison with similar peers tends to be motivating rather than demoralising, particularly when the gap between the observer and the reference person is small enough to feel closeable.",
        },
        {
          heading: "Designing with Social Norms",
          body: "The practical implications of social norms research for behaviour change design are substantial. If the goal is to increase a target behaviour, the most effective social norm intervention typically involves making visible and salient the descriptive norm that most people in the relevant group do engage in the behaviour.\n\nThis is the logic behind the now-standard finding from energy conservation research: telling households that their energy use is above the neighbourhood average produces significant reductions in consumption. The intervention does not argue that saving energy is good or explain the environmental benefits. It simply makes the descriptive norm visible \u2014 and that visibility alone is enough to shift behaviour for a substantial proportion of people.\n\nThe same principle applies to any domain where the actual norm of positive behaviour is invisible. If students do not know that a majority of their classmates complete the reading, they cannot update their behaviour in response to that information. Making the norm visible is a prerequisite for making it influential.",
        },
        {
          heading: "Summary",
          body: "Social proof is the principle that people under uncertainty look to the behaviour of similar others as a guide to appropriate action. Descriptive norms describe what people actually do; injunctive norms describe what they should do; the two can conflict, with counterproductive results. Pluralistic ignorance occurs when everyone conforms to a norm that almost nobody privately endorses, due to reliance on public rather than private signals. Social comparison theory explains why visible rankings and peer benchmarks are motivating: they connect the individual\u2019s self-evaluation to the behaviour of similar others. Effective behaviour change design makes positive descriptive norms visible \u2014 not to persuade through argument, but to shift the social reference point that people use when deciding what to do.",
        },
      ],
      createdBy: professor._id,
    },
    {
      title: "Gamification & Motivation",
      professorName: "Prof. S. Pillai",
      subject: "Behavioural Sciences",
      weekNumber: 9,
      readingTimeMinutes: 8,
      keyTermsCount: 5,
      summaryContent:
        "Gamification, intrinsic vs extrinsic motivation, variable reward schedules, generation effect, and flow state.",
      coreConcepts: [
        {
          title: "Gamification",
          description:
            "the application of game-design elements to non-game contexts to increase engagement and motivation",
          citation: "Hamuddin et al., 2024",
        },
        {
          title: "Intrinsic vs. extrinsic motivation",
          description:
            "intrinsic motivation comes from within; extrinsic is driven by external rewards. Over-reliance on extrinsic rewards can crowd out intrinsic motivation (the overjustification effect)",
          citation: "",
        },
        {
          title: "Variable reward schedule",
          description:
            "rewards delivered at unpredictable intervals produce stronger and more persistent behaviour than fixed schedules",
          citation: "",
        },
        {
          title: "Generation effect",
          description:
            "actively generating information makes a learner retain it significantly better than passively consuming it",
          citation: "",
        },
        {
          title: "Flow state",
          description:
            "total absorption in a task — achieved when challenge level is appropriately calibrated to skill level",
          citation: "Csikszentmihalyi",
        },
      ],
      keyTheorists: [
        {
          name: "Csikszentmihalyi",
          contribution:
            "flow theory \u2014 optimal experience through challenge-skill balance",
        },
        {
          name: "Deci & Ryan",
          contribution:
            "self-determination theory: autonomy, competence, and relatedness drive intrinsic motivation",
        },
      ],
      fullContent: [
        {
          heading: "Introduction",
          body: "Games are among the most effective motivation systems ever designed. A well-designed game can sustain engagement for hundreds of hours across weeks and months, generating effort, focus, and persistence that most educational and workplace settings would envy. The obvious question is whether the principles that make games so compelling can be extracted and applied to contexts \u2014 learning, health, productivity \u2014 where sustained engagement is valuable but difficult to achieve.\n\nThis question is the origin of gamification: the application of game-design elements to non-game contexts. Since the term entered widespread use around 2010, it has attracted both significant enthusiasm and significant scepticism. Understanding both the genuine promise and the real limitations of gamification requires a careful look at what actually motivates human behaviour \u2014 and why games so often succeed where other systems fail.",
        },
        {
          heading: "What is Gamification?",
          body: "Gamification is not the same as making something into a game. A gamified application is still, fundamentally, a non-game activity \u2014 a training programme, a fitness tracker, a learning platform \u2014 that incorporates game-derived elements to increase engagement and motivation. The most commonly used elements include points, badges, leaderboards, levels, and streaks.\n\nThese elements work, in part, because they make progress visible. One of the motivationally demotivating features of many real-world tasks is that progress is slow, diffuse, and hard to perceive. Reading a journal article does not produce any immediate feedback signal \u2014 you finish it and nothing happens. A gamified system interrupts this experience by providing frequent, concrete, and emotionally satisfying markers of progress, even when the underlying task is unchanged.",
        },
        {
          heading: "Intrinsic and Extrinsic Motivation",
          body: "The central tension in gamification research involves the relationship between intrinsic and extrinsic motivation. Intrinsic motivation refers to engaging in an activity because it is inherently interesting or enjoyable \u2014 because the activity itself is the reward. Extrinsic motivation refers to engaging in an activity in order to obtain a separable outcome \u2014 a grade, a badge, a salary, social recognition.\n\nSelf-Determination Theory (Deci & Ryan, 1985) identifies three fundamental psychological needs that underpin intrinsic motivation: competence (the sense of being effective and capable), autonomy (the sense of acting from one\u2019s own choice), and relatedness (the sense of connection to others). When these needs are satisfied, intrinsic motivation tends to be high.\n\nThe overjustification effect is the well-documented finding that introducing external rewards for an activity that was previously intrinsically motivated can reduce intrinsic motivation. If someone reads because they find it genuinely interesting, and you then begin paying them to read, you risk converting their internal experience of the activity from \u2018something I do because I enjoy it\u2019 to \u2018something I do for the reward.\u2019 When the reward is removed, engagement may fall below its original level.",
        },
        {
          heading: "Variable Reward Schedules",
          body: "One of the most powerful motivational mechanisms in games is the variable reward schedule: rewards given at unpredictable intervals rather than in response to fixed triggers. B.F. Skinner demonstrated in classic experiments that variable reward schedules produce the most persistent and extinction-resistant behaviour in animals. The slot machine is the paradigmatic human example \u2014 the unpredictability of the payout is precisely what makes it compelling.\n\nWell-designed games use variable reward schedules extensively: rare drops from defeated enemies, unpredictable critical hits, random loot boxes, unexpected achievement unlocks. Social media platforms use them too \u2014 the unpredictability of likes, comments, and notifications is part of what makes scrolling so hard to stop.\n\nIn educational gamification, variable rewards can be implemented through unexpected bonus points, surprise achievement unlocks, or dynamic leaderboard shifts that update in real time. The motivational power comes not from the reward itself but from the anticipatory engagement that uncertainty produces.",
        },
        {
          heading: "The Generation Effect",
          body: "One of the most practically important findings from cognitive psychology for educational design is the generation effect, documented by Slamecka and Graf (1978). The generation effect refers to the robust finding that information that is actively produced \u2014 generated \u2014 by the learner is retained significantly better than information that is passively received.\n\nIn the original experiments, participants were given either complete word pairs to study (e.g., \u2018cold \u2014 hot\u2019) or incomplete pairs that required them to generate the target word themselves (e.g., \u2018cold \u2014 h__\u2019). Recall was substantially better for generated words than for read words, even though the cognitive content was identical.\n\nFor gamified learning, this means that puzzle-creation activities \u2014 where learners must turn content into questions or problems that others can solve \u2014 are not just engaging but pedagogically superior to passive consumption. The act of building the puzzle forces a level of engagement with the material that reading alone does not require.",
        },
        {
          heading: "Flow: The Psychology of Optimal Experience",
          body: "Mihaly Csikszentmihalyi\u2019s concept of flow describes a state of optimal experience characterised by total absorption in a challenging activity, loss of self-consciousness, distorted time perception, and a sense of intrinsic reward from the activity itself. Flow is most likely to occur when the challenge level of an activity closely matches the skill level of the participant \u2014 when the task is neither so easy that it is boring nor so difficult that it is overwhelming.\n\nGames are particularly good at producing flow because they are designed to calibrate challenge to skill in real time \u2014 through adaptive difficulty systems, level progressions, and feedback loops that tell the player exactly how they are doing at each moment. This calibration keeps the player in the narrow band between boredom and anxiety where flow is possible.\n\nEducational gamification aspires to the same calibration. A well-designed learning system would adjust the difficulty of challenges to the learner\u2019s demonstrated level, provide immediate and informative feedback, and create clear goals that give the learner a sense of direction and progress.",
        },
        {
          heading: "Evidence from Educational Contexts",
          body: "Oates, Pechenkina and colleagues (2016) evaluated the impact of a gamified mobile learning application (Quitch) on student engagement and academic performance at Swinburne University. Across a sample of 711 students, they found that app users achieved an average assessment score of 65.19% compared to 58.16% for non-users \u2014 a difference of over seven percentage points. Retention rates were also 12.23% higher among app users.\n\nResearch by Damanik and colleagues (2024) in an English language learning context found that gamified quizzes produced three qualitative benefits \u2014 improved reading comprehension, increased motivation, and enhanced critical thinking \u2014 with leaderboards and time-limited challenges identified as particularly effective elements.\n\nIt is important to note the limitations of this evidence base. Much gamification research involves relatively short interventions with limited follow-up, making it difficult to assess long-term effects.",
        },
        {
          heading: "Summary",
          body: "Gamification applies game-design elements \u2014 points, badges, leaderboards, streaks, variable rewards \u2014 to non-game contexts in order to increase engagement and motivation. Its effectiveness depends on a careful balance: extrinsic rewards can crowd out intrinsic motivation, but the right design can harness social proof, variable reward psychology, and the generation effect to produce genuine and sustained learning benefits. Flow theory provides a framework for understanding optimal engagement and the conditions under which it occurs. The most defensible conclusion is that gamification works when it is designed around the underlying psychology of motivation rather than treated as a superficial layer of game aesthetics applied to unchanged content.",
        },
      ],
      createdBy: professor._id,
    },
  ]);
  console.log(`Created ${readings.length} reading materials`);

  // Create sample puzzles from the content pack
  const puzzleData = [
    {
      title: "Guess the concept",
      readingIdx: 0,
      creator: 1,
      assignee: 0,
      word: "AGENDA",
      clue: '"Media doesn\'t tell you what to think — just what to think about. This theory names that effect."',
      maxAttempts: 6,
    },
    {
      title: "Name the technique",
      readingIdx: 0,
      creator: 2,
      assignee: 1,
      word: "FRAMING",
      clue: "\"The same event, packaged differently. 'Benefit fraud' vs. 'poverty crisis' — same facts, opposite effect. This is the technique.\"",
      maxAttempts: 6,
    },
    {
      title: "Present ___",
      readingIdx: 1,
      creator: 3,
      assignee: 2,
      word: "BIAS",
      clue: "\"The 'present' version of this affects how we weigh immediate comfort against future benefit. It's why the reading never gets done.\"",
      maxAttempts: 6,
    },
    {
      title: "Key principle",
      readingIdx: 2,
      creator: 4,
      assignee: 3,
      word: "NORMS",
      clue: '"The invisible rules that govern behaviour in groups. Descriptive ones tell you what people do; injunctive ones tell you what should be done."',
      maxAttempts: 6,
    },
    {
      title: "Total absorption",
      readingIdx: 3,
      creator: 5,
      assignee: 4,
      word: "FLOW",
      clue: '"Csikszentmihalyi\'s term for total absorption in a task that is challenging but achievable. The opposite of boredom and anxiety simultaneously."',
      maxAttempts: 6,
    },
  ];

  const puzzles = await Promise.all(
    puzzleData.map((p) =>
      Puzzle.create({
        title: p.title,
        readingMaterialId: readings[p.readingIdx]._id,
        createdBy: students[p.creator]._id,
        assignedTo: students[p.assignee]._id,
        puzzleType: "wordle",
        solutionWord: p.word,
        clue: p.clue,
        maxAttempts: p.maxAttempts,
        dateActive: new Date(),
      }),
    ),
  );
  console.log(`Created ${puzzles.length} puzzles`);

  await mongoose.disconnect();
  console.log("\n✅ Seed complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("Student: riya@university.edu / student123");
  console.log("Student: rohan@university.edu / student123");
  console.log("Professor: pillai@university.edu / professor123");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
