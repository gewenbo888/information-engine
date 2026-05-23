import type { Bi } from "./lang";

export type Section = {
  num: string;
  id: string;
  title: Bi;
  sub: Bi;
  body: Bi;
};

/* ----------------------------------------------------------------------
   The ten core systems
---------------------------------------------------------------------- */
export const SECTIONS: Section[] = [
  {
    num: "01",
    id: "origin",
    title: { en: "The Origin of Information", zh: "信息的起源" },
    sub: { en: "Signal, entropy, and the birth of the bit", zh: "信号、熵，与比特的诞生" },
    body: {
      en: "Before meaning, there is difference. A system carries information when its state could have been otherwise — when there is uncertainty for an observer to resolve. Claude Shannon made this precise in 1948: information is measured not by what a message means but by how much it reduces uncertainty, quantified in bits. From the spin of a particle to the firing of a neuron to a letter on a page, information begins wherever one configuration is selected out of many possible ones.",
      zh: "在意义之前，先有差异。当一个系统的状态本可以不同——当存在等待观察者消解的不确定性时——它便携带了信息。1948 年，克劳德·香农将这一点精确化：信息的度量，不在于消息意味着什么，而在于它消除了多少不确定性，单位是比特。从粒子的自旋，到神经元的放电，再到纸上的一个字母，信息诞生于这样一刻：从众多可能的构型中，一种被选定。",
    },
  },
  {
    num: "02",
    id: "symbol",
    title: { en: "Language & Symbol", zh: "语言与符号" },
    sub: { en: "Compressing the world into shared marks", zh: "把世界压缩进共享的符号" },
    body: {
      en: "A symbol is a compression: a small, shareable mark that stands for something larger. Speech encoded thought into sound; writing froze sound into durable form; the alphabet reduced thousands of pictures to a few dozen reusable letters; mathematics and logic compressed reasoning into manipulable notation; code turned instructions into executable text. Each leap traded raw detail for composability — fewer primitives, recombined without limit — letting a finite set of symbols express an unbounded space of meaning.",
      zh: "符号是一种压缩：一个微小、可共享的标记，代表着更大的事物。言语把思想编码为声音；文字把声音冻结为可久存的形态；字母表把成千上万的图画，化简为几十个可复用的字母；数学与逻辑把推理压缩成可操作的记号；代码则把指令变为可执行的文本。每一次跃迁，都以原始的细节，换取可组合性——更少的基元，却能无限重组——让有限的符号，去表达无界的意义空间。",
    },
  },
  {
    num: "03",
    id: "dna",
    title: { en: "DNA & Biological Information", zh: "DNA 与生物信息" },
    sub: { en: "Life as self-replicating, error-correcting code", zh: "生命：自我复制、自我纠错的代码" },
    body: {
      en: "Life is the oldest information technology. Four nucleotide letters spell out, in three-letter words, the recipes for every protein in every cell — a code billions of years old, copied with extraordinary fidelity and proofread against errors. The genome is not a blueprint but a program: read, transcribed, translated, and executed by molecular machines. Before brains, before language, evolution had already discovered storage, copying, mutation, and selection — the core operations of any system that learns.",
      zh: "生命，是最古老的信息技术。四个核苷酸字母，以三字母为一词，拼写出每个细胞中每种蛋白质的配方——一段数十亿年之久的代码，以惊人的保真度复制，并经校对纠错。基因组不是蓝图，而是程序：被分子机器读取、转录、翻译、执行。在大脑之前，在语言之前，演化早已发明了存储、复制、突变与选择——任何会学习的系统所共有的核心操作。",
    },
  },
  {
    num: "04",
    id: "computation",
    title: { en: "Computation & Algorithms", zh: "计算与算法" },
    sub: { en: "The minimal definition of what can be known", zh: "可知之物的最小定义" },
    body: {
      en: "In 1936 Alan Turing stripped computation to its skeleton: a tape of symbols, a head that reads and writes, and a finite table of rules. Astonishingly, this minimal machine can compute anything any computer can — it defines the very boundary of the computable. Around this core grew the rest: algorithms that transform information into action, compression that squeezes out redundancy, and error-correcting codes that let signals survive a noisy world. Computation is how information stops being merely stored and starts doing work.",
      zh: "1936 年，阿兰·图灵把计算剥到只剩骨架：一条符号纸带，一个读写头，一张有限的规则表。令人震惊的是，这台极简的机器，能计算任何计算机所能计算的一切——它定义了「可计算」这一边界本身。围绕这一内核，其余皆由此生长：把信息转化为行动的算法，挤出冗余的压缩，以及让信号在嘈杂世界中存活的纠错码。计算，是信息不再只是被存储、而开始做功的方式。",
    },
  },
  {
    num: "05",
    id: "network",
    title: { en: "Networks & the Planetary Nervous System", zh: "网络与行星神经系统" },
    sub: { en: "From the telegraph to a single low-latency planet", zh: "从电报，到一颗低延迟的星球" },
    body: {
      en: "Communication is information defeating distance. The telegraph severed the link between message and messenger; the telephone, radio, and television widened the channel; the internet made every node addressable and every message routable. Each layer collapsed latency and multiplied bandwidth, knitting billions of people and devices into one continuously updating fabric. Humanity now behaves, in part, like a single distributed organism — sensing, signaling, and coordinating at the speed of light.",
      zh: "通信，是信息对距离的征服。电报斩断了消息与信使之间的捆绑；电话、广播与电视拓宽了信道；互联网让每个节点皆可寻址、每条消息皆可路由。每一层都压缩了延迟、倍增了带宽，将数十亿人与设备，编织成一张持续刷新的织物。如今的人类，在某种程度上，已像一个单一的分布式有机体——以光速感知、传讯、协调。",
    },
  },
  {
    num: "06",
    id: "crypto",
    title: { en: "Money, Cryptography & Consensus", zh: "货币、密码学与共识" },
    sub: { en: "Coordinating strangers without a center", zh: "无需中心，协调陌生人" },
    body: {
      en: "Money is memory: a ledger of who owes what, abstracted into a token that anyone will accept. For most of history that ledger needed a trusted center — a temple, a bank, a state. Cryptography changed the terms. Hash functions fingerprint data; digital signatures prove authorship; consensus protocols let mutually distrustful strangers agree on one shared history without a central authority. Zero-knowledge proofs go further still — letting one party prove a statement is true while revealing nothing else. Economic coordination, at its root, is information coordination.",
      zh: "货币是记忆：一本记录谁欠谁多少的账本，被抽象成一枚人人愿意接受的代币。历史的大部分时间里，这本账本都需要一个受信的中心——一座神庙、一家银行、一个国家。密码学改写了规则。哈希函数为数据按下指纹；数字签名证明作者身份；共识协议让互不信任的陌生人，无需中央权威，便能就同一段共享历史达成一致。零知识证明则走得更远——让一方证明某个陈述为真，却不泄露任何其他信息。经济协调，归根到底，是信息协调。",
    },
  },
  {
    num: "07",
    id: "ai",
    title: { en: "AI & the Compression of Reality", zh: "AI 与现实的压缩" },
    sub: { en: "Intelligence as compression plus prediction", zh: "智能：压缩，加上预测" },
    body: {
      en: "A large model is a compression of its training data into a few hundred billion numbers — and to compress well, it must discover the regularities that generate the data. Meaning becomes geometry: words and concepts become points in a high-dimensional space where nearness is relatedness, and analogy becomes arithmetic. From this compressed world-model the system predicts what comes next, token by token. It is an old hypothesis made concrete: that to predict well is to understand, and that intelligence may be, at bottom, very good compression.",
      zh: "一个大模型，是把它的训练数据压缩进几千亿个数字——而要压缩得好，它就必须发现生成这些数据的规律。意义化为几何：词语与概念成为高维空间中的点，邻近即相关，类比变成了算术。从这个被压缩的世界模型出发，系统逐个 token 地预测接下来会发生什么。这是一个古老假说的具象化：善于预测，即是理解；而智能，归根结底，也许就是极好的压缩。",
    },
  },
  {
    num: "08",
    id: "quantum",
    title: { en: "Quantum Information", zh: "量子信息" },
    sub: { en: "Does the universe compute?", zh: "宇宙在计算吗？" },
    body: {
      en: "At the smallest scale, information stops behaving classically. A qubit is not a 0 or a 1 but a superposition of both, and entangled qubits share a single state across any distance. This is not a metaphor for computation — it is a different physics of information, one that may factor numbers and simulate molecules beyond any classical reach. Stranger still, physics suggests the information a region can hold scales with its surface, not its volume, and that black holes obey a thermodynamics of bits. Some physicists take the next step: perhaps reality is not described by information but made of it.",
      zh: "在最小的尺度上，信息不再以经典的方式行事。一个量子比特不是 0 或 1，而是二者的叠加；纠缠的量子比特，跨越任意距离共享同一个状态。这并非计算的比喻——它是一种关于信息的、不同的物理学，或许能分解大数、模拟分子，远超任何经典手段所及。更奇异的是，物理学暗示：一个区域所能容纳的信息，正比于它的表面积，而非体积；黑洞遵循一种关于比特的热力学。一些物理学家更进一步：也许现实并非由信息所描述，而是由信息所构成。",
    },
  },
  {
    num: "09",
    id: "memes",
    title: { en: "Memes & the Collective Mind", zh: "模因与集体心智" },
    sub: { en: "Culture as information under selection", zh: "文化：选择压力下的信息" },
    body: {
      en: "Genes are not the only replicators. Ideas — stories, songs, beliefs, techniques, jokes — copy themselves from mind to mind, mutating and competing for the scarce resource of human attention. Richard Dawkins called them memes, and the analogy runs deep: what survives in a culture is not necessarily what is true or good, but what is most transmissible. Religions, myths, ideologies, and viral posts are all information that has learned to spread. Networks accelerate the process; a culture is the slowly evolving memory of a species.",
      zh: "基因并非唯一的复制者。观念——故事、歌曲、信仰、技艺、笑话——在一个又一个心智之间自我复制，突变并争夺人类注意力这一稀缺资源。理查德·道金斯称之为模因，而这一类比意味深长：在一种文化中存活下来的，未必是真实或良善之物，而是最易传播之物。宗教、神话、意识形态与病毒式传播的帖子，都是学会了扩散的信息。网络加速了这一进程；而文化，是一个物种缓慢演化的记忆。",
    },
  },
  {
    num: "10",
    id: "future",
    title: { en: "The Planetary Information Organism", zh: "行星信息有机体" },
    sub: { en: "Where the engine is heading", zh: "引擎的去向" },
    body: {
      en: "Run the trend forward. Memory grows cheaper and vaster; bandwidth approaches the physical limit; models compress more of the world each year; brains and machines edge toward direct interface. The boundary between individual and collective cognition is thinning. It is at least plausible that civilization is condensing into a single planetary-scale information system — one that senses, remembers, models, and decides as a whole. Whether that becomes a tool we wield or a mind in its own right is the open question of the century. The experiment is already running; we are inside it.",
      zh: "把趋势向前推演。记忆愈发廉价而浩瀚；带宽逼近物理极限；模型每年都压缩进更多的世界；大脑与机器，正向着直接接口靠近。个体认知与集体认知之间的边界，正在变薄。至少有理由相信：文明，正凝结为一个行星尺度的单一信息系统——一个作为整体去感知、记忆、建模与决断的系统。它将成为我们所执掌的工具，还是一个自成一体的心智，是这个世纪悬而未决的问题。实验早已开始；而我们，身在其中。",
    },
  },
];

/* ----------------------------------------------------------------------
   Meta-model — the seven terms of information power
   Information Power = Compression + Transmission + Error Correction +
   Abstraction + Connectivity + Memory + Computation
---------------------------------------------------------------------- */
export type MetaTerm = { key: string; sym: string; name: Bi; def: Bi };

export const META_TERMS: MetaTerm[] = [
  { key: "compression", sym: "C", name: { en: "Compression", zh: "压缩" }, def: { en: "Squeezing redundancy out — saying more with less.", zh: "挤出冗余——以更少，言更多。" } },
  { key: "transmission", sym: "T", name: { en: "Transmission Speed", zh: "传输速度" }, def: { en: "How fast information crosses distance.", zh: "信息跨越距离的速度。" } },
  { key: "errorcorrection", sym: "E", name: { en: "Error Correction", zh: "纠错" }, def: { en: "Surviving noise; copying without drift.", zh: "在噪声中存活；复制而不漂移。" } },
  { key: "abstraction", sym: "A", name: { en: "Symbolic Abstraction", zh: "符号抽象" }, def: { en: "Standing for the world with reusable marks.", zh: "以可复用的符号，代表世界。" } },
  { key: "connectivity", sym: "N", name: { en: "Network Connectivity", zh: "网络连接" }, def: { en: "How many nodes can reach how many others.", zh: "多少节点，能触达多少其他节点。" } },
  { key: "memory", sym: "M", name: { en: "Memory Persistence", zh: "记忆持存" }, def: { en: "How long information endures intact.", zh: "信息能完好存续多久。" } },
  { key: "computation", sym: "P", name: { en: "Computational Capacity", zh: "计算能力" }, def: { en: "Turning stored information into new information.", zh: "把存储的信息，转化为新的信息。" } },
];

/* Profiles across the seven terms (0–100), used by the meta-model radar. */
export type ProfileSystem = { name: Bi; accent: string; scores: number[] };
// score order matches META_TERMS: [C, T, E, A, N, M, P]
export const PROFILE_SYSTEMS: ProfileSystem[] = [
  { name: { en: "DNA / Genome", zh: "DNA / 基因组" }, accent: "#23e6b3", scores: [60, 8, 90, 35, 20, 95, 30] },
  { name: { en: "Spoken Language", zh: "口语" }, accent: "#ffc861", scores: [55, 25, 30, 80, 30, 18, 25] },
  { name: { en: "Writing & Print", zh: "文字与印刷" }, accent: "#ff79bf", scores: [50, 35, 55, 88, 45, 80, 20] },
  { name: { en: "The Internet", zh: "互联网" }, accent: "#67d8fb", scores: [70, 98, 75, 70, 98, 70, 78] },
  { name: { en: "Large AI Models", zh: "大型 AI 模型" }, accent: "#9af9e1", scores: [98, 85, 65, 92, 80, 75, 95] },
];

/* ----------------------------------------------------------------------
   Open questions
---------------------------------------------------------------------- */
export const BIG_QUESTIONS: { q: Bi; lens: Bi }[] = [
  {
    q: { en: "Is information physical, or is the physical informational?", zh: "信息是物理的，还是物理是信息的？" },
    lens: { en: "Landauer · Wheeler · digital physics", zh: "兰道尔 · 惠勒 · 数字物理学" },
  },
  {
    q: { en: "Does meaning reduce to information, or escape it?", zh: "意义能否还原为信息，还是逃逸于信息之外？" },
    lens: { en: "semantics vs. Shannon's syntax", zh: "语义，对阵香农的句法" },
  },
  {
    q: { en: "Is intelligence simply very good compression and prediction?", zh: "智能，是否不过是极好的压缩与预测？" },
    lens: { en: "Solomonoff · Hutter · large models", zh: "所罗门诺夫 · 胡特 · 大模型" },
  },
  {
    q: { en: "Can information ever truly be destroyed?", zh: "信息，真的能被彻底销毁吗？" },
    lens: { en: "the black-hole information paradox", zh: "黑洞信息悖论" },
  },
  {
    q: { en: "Where does the individual mind end and the collective begin?", zh: "个体心智在何处终结，集体又从何处开始？" },
    lens: { en: "extended mind · networked cognition", zh: "延展心智 · 网络化认知" },
  },
  {
    q: { en: "If reality computes, what is it computing — and for whom?", zh: "若现实在计算，它在计算什么——又为谁而算？" },
    lens: { en: "the hardest question of all", zh: "最难的那个问题" },
  },
];

/* ----------------------------------------------------------------------
   Future systems (Section 10 grid)
---------------------------------------------------------------------- */
export const FUTURES: { name: Bi; horizon: Bi; desc: Bi; accent: string }[] = [
  {
    name: { en: "Artificial General Intelligence", zh: "通用人工智能" },
    horizon: { en: "near", zh: "近期" },
    accent: "#23e6b3",
    desc: {
      en: "Systems that compress and predict across every domain at once — a general-purpose engine for turning information into understanding and action.",
      zh: "一种能在所有领域同时压缩与预测的系统——一台把信息转化为理解与行动的通用引擎。",
    },
  },
  {
    name: { en: "Brain–Computer Interfaces", zh: "脑机接口" },
    horizon: { en: "emerging", zh: "新兴" },
    accent: "#2fc6f5",
    desc: {
      en: "Direct channels between neural signals and machines, narrowing the gap between thought and digital information to near zero latency.",
      zh: "神经信号与机器之间的直接信道，把思想与数字信息之间的距离，缩窄到近乎零延迟。",
    },
  },
  {
    name: { en: "Planetary Cognition", zh: "行星认知" },
    horizon: { en: "this century", zh: "本世纪" },
    accent: "#f5b338",
    desc: {
      en: "Billions of minds, sensors, and models coupled tightly enough to sense, model, and decide as one distributed organism.",
      zh: "数十亿心智、传感器与模型，耦合得足够紧密，以致能作为一个分布式有机体去感知、建模与决断。",
    },
  },
  {
    name: { en: "Synthetic Memory", zh: "合成记忆" },
    horizon: { en: "underway", zh: "进行中" },
    accent: "#ff4da6",
    desc: {
      en: "External, searchable, perfectly persistent memory — civilization's collective recall offloaded into infrastructure that never forgets.",
      zh: "外部的、可检索的、完美持存的记忆——文明的集体回忆，被卸载进永不遗忘的基础设施。",
    },
  },
  {
    name: { en: "Digital Consciousness", zh: "数字意识" },
    horizon: { en: "speculative", zh: "推测" },
    accent: "#9af9e1",
    desc: {
      en: "The open frontier: whether information processed in the right pattern can give rise to genuine inner experience — and how we would ever know.",
      zh: "敞开的前沿：以恰当模式处理的信息，能否产生真正的内在体验——以及，我们究竟如何能够得知。",
    },
  },
  {
    name: { en: "Programmable Societies", zh: "可编程社会" },
    horizon: { en: "contested", zh: "充满争议" },
    accent: "#a6e9fd",
    desc: {
      en: "Rules, money, and coordination encoded as transparent, executable information — and the deep question of who gets to write the code.",
      zh: "把规则、货币与协调，编码为透明、可执行的信息——以及一个深刻的问题：由谁来书写这段代码。",
    },
  },
];
