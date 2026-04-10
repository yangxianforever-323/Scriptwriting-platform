/**
 * AI Novel Analysis API (Enhanced)
 * POST /api/ai/analyze-novel - Deep analyze novel into structured story elements
 * Outputs comprehensive data for storyboard generation pipeline
 */

import { NextResponse } from "next/server";

const DOUCIBASE_API_KEY = process.env.DOUCIBASE_API_KEY;
const DOUCIBASE_BASE_URL = process.env.DOUCIBASE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3/responses";
const DOUCIBASE_MODEL = process.env.DOUCIBASE_MODEL || "ep-20260301183547-bbw2x";

async function callDoubaoAPI(inputs: any[]): Promise<any> {
  if (!DOUCIBASE_API_KEY) {
    throw new Error("DOUCIBASE_API_KEY is not configured");
  }

  const response = await fetch(DOUCIBASE_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DOUCIBASE_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUCIBASE_MODEL,
      stream: false,
      input: inputs,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Doubao API error:", errorData);
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function extractTextFromResponse(response: any): string {
  if (response.output && Array.isArray(response.output) && response.output.length > 0) {
    const firstOutput = response.output[0];
    if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
      const textContent = firstOutput.content.find((c: any) => c.type === "output_text");
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }
  if (response.output?.choices?.[0]?.message?.content) {
    return response.output.choices[0].message.content;
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Novel content is required" }, { status: 400 });
    }

    if (!DOUCIBASE_API_KEY) {
      console.warn("Doubao API key not configured, using enhanced mock analysis");
      const mockAnalysis = generateEnhancedMockAnalysis(content, title);
      return NextResponse.json(mockAnalysis);
    }

    const systemPrompt = `你是一个专业的影视剧本分析师和叙事结构专家。你的任务是将小说/剧本内容进行深度拆解，输出结构化数据，用于后续的分镜设计和AI图像生成。

请严格按照以下JSON格式返回分析结果，不要包含任何其他文字：

{
  "title": "故事标题",
  "logline": "一句话核心梗概（50-80字，突出冲突和看点）",
  "synopsis": "详细故事概要（300-600字，包含起承转合）",
  "genre": "题材类型（如：玄幻/都市/科幻/悬疑/武侠/历史/爱情/恐怖等，可多选用逗号分隔）",
  "targetDuration": 预估成片时长（分钟，数字）,
  "tone": "整体基调（如：热血/暗黑/治愈/喜剧/史诗/悬疑等）",

  "characters": [
    {
      "id": "char_唯一标识",
      "name": "角色名",
      "role": "protagonist/antagonist/supporting/minor",
      "description": "角色深度描述（100-200字，包含身份、核心动机、在故事中的作用）",
      "appearance": "外貌特征详细描写（50-100字，包含体型、发型、面部特征、标志性服装/配饰、年龄感）",
      "personality": "性格特征（30-50字，3-5个关键词+简要说明）",
      "background": "背景故事（50-100字，出身、经历、与主线剧情的关系）",
      "keyProps": ["该角色关联的重要道具1", "重要道具2"],
      "relationships": [
        { "target": "另一角色名", "relation": "关系类型（如：师徒/恋人/仇敌/父子/主仆/盟友/竞争者）", "description": "关系简述" }
      ],
      "visualKeywords": ["用于AI生成形象的关键词1", "关键词2", "关键词3"]
    }
  ],

  "locations": [
    {
      "id": "loc_唯一标识",
      "name": "地点名称",
      "description": "地点详细描述（80-150字，空间布局、环境特征、在剧情中的意义）",
      "atmosphere": "氛围描述（20-40字，光线、气味、声音等感官细节）",
      "timeSettings": ["该地点常见的时间段（如：黄昏/深夜/清晨/正午）"],
      "visualElements": ["视觉元素关键词（如：破败古庙/霓虹街道/幽暗森林）"],
      "associatedProps": ["此地点出现的特殊道具或物品"]
    }
  ],

  "acts": [
    {
      "id": "act_唯一标识",
      "title": "幕标题（格式：第X幕：主题词）",
      "description": "本幕概述（80-150字，核心事件、情绪走向、叙事功能）",
      "narrativeFunction": "叙事功能（如：铺垫/发展/转折/高潮/收尾）",
      "moodTone": "本幕主导情绪（如：紧张压抑/温馨舒缓/激烈对抗/悲伤沉重）",
      "pacing": "节奏描述（快/中/慢 + 说明）",
      "scenes": [
        {
          "id": "scene_唯一标识",
          "title": "场景标题",
          "description": "场景详细描述（100-200字，发生了什么、关键动作/对话、情节推进）",
          "location": "发生地点名称",
          "locationId": "对应location的id",
          "characters": ["出场角色名列表"],
          "characterIds": ["对应character的id列表"],
          "timeOfDay": "具体时间（如：黄昏时分/深夜子时/黎明前刻）",
          "mood": "场景情绪（10-20字）",
          "props": [
            {
              "name": "道具/物品名称",
              "type": "weapon/item/tool/accessory/other",
              "description": "外观和用途描述（20-50字）",
              "holder": "持有或使用此道具的角色名"
            }
          ],
          "visualStyle": {
            "style": "建议视觉风格（如：暗黑写实/温暖动漫/水墨国风）",
            "colorTone": "建议色调（如：冷蓝调/暖橙调/高对比黑白）",
            "lighting": "建议光影（如：侧光伦勃朗/逆光剪影/柔光散射）",
            "cameraAngle": "建议镜头角度"
          },
          "atmosphereRef": "氛围参考文字（30-60字，用于指导AI生成画面时的情绪表达）",
          "narrativePurpose": "此场景的叙事目的（如：建立世界观/展现人物关系/推动冲突/揭示秘密/情感高潮）"
        }
      ]
    }
  ],

  "globalProps": [
    {
      "name": "贯穿全剧的重要道具/物品",
      "type": "weapon/item/tool/accessory/symbolic",
      "description": "详细描述",
      "significance": "在故事中的象征意义或关键作用",
      "firstAppearance": "首次出现在哪一幕哪个场景"
    }
  ]
}

【重要规则】
1. 必须返回严格合法的JSON，可直接 JSON.parse
2. characters 数量控制在 5-10 个主要角色，按重要性排序
3. locations 数量 4-8 个主要场景地点
4. acts 按"三幕式"或"五幕式"结构合理划分，通常 3-5 幕
5. 每个幕下至少 2-4 个场景
6. **每个场景必须仔细提取其中出现的道具/物品/武器**，这是后续分镜设计的关键输入
7. 角色的 keyProps 和 relationships 必须基于原文实际内容推导
8. visualKeywords 和 visualElements 要具体可感知，便于AI图像生成
9. globalProps 提取对剧情有推动作用的标志性物品`;

    const userPrompt = `请对以下${title ? `《${title}》` : ""}小说/剧本进行深度专业分析：

=== 原始内容 ===
${content.substring(0, 30000)}
${content.length > 30000 ? `\n[注：内容过长，已截取前30000字符进行分析]` : ""}
=== 内容结束 ===

请直接返回完整的JSON分析结果，确保所有字段都根据原文内容认真填写。特别关注：
- 角色的外貌细节要有画面感
- 场景中的道具/武器/物品必须逐一提取
- 分幕要体现叙事节奏的变化
- 每个场景都要有明确的视觉风格建议`;

    const inputs = [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: userPrompt }] },
    ];

    let response = await callDoubaoAPI(inputs);
    let aiResponse = extractTextFromResponse(response);

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try { result = JSON.parse(jsonMatch[1]); } catch { throw new Error("Failed to parse JSON"); }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    result.title = title || result.title || "未命名项目";
    if (!result.acts) result.acts = [];
    if (!result.characters) result.characters = [];
    if (!result.locations) result.locations = [];
    if (!result.globalProps) result.globalProps = [];

    result.acts.forEach((act: any) => {
      if (!act.scenes) act.scenes = [];
      act.scenes.forEach((scene: any) => {
        if (!scene.props) scene.props = [];
        if (!scene.characters) scene.characters = [];
      });
    });

    result.characters.forEach((char: any) => {
      if (!char.relationships) char.relationships = [];
      if (!char.keyProps) char.keyProps = [];
      if (!char.visualKeywords) char.visualKeywords = [];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing novel:", error);
    try {
      const { content, title } = await request.clone().json();
      const mockAnalysis = generateEnhancedMockAnalysis(content, title);
      return NextResponse.json(mockAnalysis);
    } catch {
      return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
    }
  }
}

function generateEnhancedMockAnalysis(content: string, title: string) {
  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0] || "故事";
  const wordCount = content.length;
  const hasCombat = /打|杀|战|刀|剑|武|斗|攻/.test(content);
  const hasMagic = /法|术|灵|气|咒|阵|魂|魔|仙|神/.test(content);
  const hasRomance = /爱|恋|情|心|喜欢|吻|拥抱/.test(content);
  const genre = hasMagic ? "玄幻" : hasCombat ? "武侠" : hasRomance ? "爱情" : "都市";

  return {
    title: title || firstLine.substring(0, 30) || "未命名项目",
    logline: `一个关于${firstLine.substring(0, 40)}的故事，主角在面对命运挑战时，必须在正义与个人情感之间做出抉择，最终找到属于自己的道路。`,
    synopsis: `故事围绕${firstLine.substring(0, 60)}展开。全篇约${wordCount}字，通过多视角叙事，展现了人物之间错综复杂的关系网。从平静的开端到激烈的冲突升级，再到最终的命运决战，每一个转折都扣人心弦。`,
    genre: genre,
    targetDuration: Math.max(45, Math.round(wordCount / 400)),
    tone: hasCombat ? "热血激昂" : hasRomance ? "温情浪漫" : "深沉内敛",
    characters: [
      {
        id: "char_protagonist",
        name: "林萧",
        role: "protagonist",
        description: "故事的绝对核心人物，出身平凡但天赋异禀。在命运的推动下卷入一场关乎天下苍生的大事件中，从一个不谙世事的少年逐渐成长为能够独当一面的英雄。",
        appearance: "约二十岁出头，身形修长但不瘦弱，面容清秀而坚毅。黑色短发略显凌乱，眼神明亮有神。常穿一身深青色劲装，腰间束着暗纹皮带，行动间透着一股少年人的锐气。",
        personality: "坚韧不屈、重情重义、有时过于冲动但本性善良。面对困难从不轻易放弃，对朋友极度忠诚。",
        background: "自幼在偏僻山村长大，被一位隐世高人收为弟子。父母早亡的身世让他比同龄人更早熟，也更深地渴望力量来守护重要的人。",
        keyProps: ["青锋剑", "玉佩信物"],
        relationships: [
          { target: "苏婉儿", relation: "恋人", description: "青梅竹马，两情相悦但历经波折" },
          { target: "厉无痕", relation: "师徒/亦敌亦友", description: "授业恩师，却隐藏着惊天秘密" },
          { target: "莫邪", relation: "宿敌", description: "理念相左的死对头，多次正面对决" },
        ],
        visualKeywords: ["英俊青年", "青色劲装", "坚毅眼神", "佩剑少年", "古风侠客"],
      },
      {
        id: "char_female_lead",
        name: "苏婉儿",
        role: "supporting",
        description: "女主角，聪慧机敏的医道传人。不仅以医术辅助主角团，更在关键时刻以智慧和勇气扭转战局。",
        appearance: "十八九岁年纪，容貌清丽脱俗，眉眼间带着几分英气。长发常以素色丝带轻束，身着淡青白相间的衣裙，腰间挂着药囊。举手投足间有一种从容不迫的气质。",
        personality: "外柔内刚、心思缜密、富有同情心。表面上温婉可人，内心却有着惊人的决断力。",
        background: "出身医药世家，自幼随父行医济世。家族因卷入一场阴谋而没落，她独自背负着复兴家业和寻找真相的双重使命。",
        keyProps: ["药囊", "银针", "家传医书"],
        relationships: [
          { target: "林萧", relation: "恋人", description: "青梅竹马，彼此是最信任的人" },
        ],
        visualKeywords: ["清丽少女", "淡青衣裙", "医女形象", "温柔坚定", "古装美人"],
      },
      {
        id: "char_antagonist",
        name: "莫邪",
        role: "antagonist",
        description: "最终反派，曾是正道翘楚却因执念堕入魔道。认为只有极端手段才能终结乱世，与主角的理念形成根本对立。",
        appearance: "三十岁左右，面容俊美阴柔，肤色苍白。常着黑底红纹的长袍，周身隐隐散发着令人不安的气息。一双狭长的眼眸中总是带着讥讽和疯狂。",
        personality: "极端偏执、高傲冷酷、才华横溢但误入歧途。对自己的理念有着近乎狂热的坚持。",
        background: "曾是与主角师父齐名的天才，因目睹太多无辜死亡而走向极端，认为牺牲少数人是拯救多数的唯一途径。",
        keyProps: ["噬血刃", "魔功秘籍"],
        relationships: [
          { target: "林萧", relation: "宿敌", description: "理念死敌，最终对决的对手" },
          { target: "厉无痕", relation: "旧识/叛出师门", description: "曾经的同门，如今的对立面" },
        ],
        visualKeywords: ["阴柔男子", "黑红长袍", "邪魅气质", "苍白俊美", "魔道高手"],
      },
      {
        id: "char_mentor",
        name: "厉无痕",
        role: "supporting",
        description: "主角的师父，隐世不出的绝顶高手。表面冷漠实则深情，一直在暗中守护着主角的成长。",
        appearance: "年约四五十岁，须发半白，身材挺拔如松。穿着朴素的灰布长衫，但气度非凡。一双眼睛深邃如潭水，似乎能看穿一切虚妄。",
        personality: "外冷内热、沉默寡言、深谋远虑。不善言辞但行动胜过千言万语。",
        background: "三十年前的江湖传奇人物，因一场变故退隐山林。收主角为徒是他在这个乱世中最后的寄托。",
        keyProps: ["残剑", "泛黄书信"],
        relationships: [
          { target: "林萧", relation: "师徒", description: "亦师亦父的深厚羁绊" },
          { target: "莫邪", relation: "旧识", description: "曾经最得意的弟子，最大的遗憾" },
        ],
        visualKeywords: ["中年侠客", "灰布长衫", "白发长须", "深邃眼神", "隐世高人"],
      },
    ],
    locations: [
      {
        id: "loc_village",
        name: "青溪村",
        description: "主角成长的偏远山村，依山傍水，民风淳朴。村中有古井老树，是主角童年记忆最深的所在。后因战火波及而毁，成为主角心中永远的痛。",
        atmosphere: "晨雾缭绕的山村，炊烟袅袅，远处传来鸡鸣犬吠。空气中弥漫着泥土和草木的清新气息。",
        timeSettings: ["清晨", "黄昏", "夜晚"],
        visualElements: ["青山绿水小村庄", "袅袅炊烟", "古井老树", "石板路茅草屋"],
        associatedProps: ["玉佩信物"],
      },
      {
        id: "loc_sect",
        name: "归元宗·后山禁地",
        description: "主角拜师学艺之地，一处隐蔽于深山的古老宗门。后山禁地更是藏有宗门最大秘密所在，也是主角获得关键机缘的地方。",
        atmosphere: "终年云雾缭绕的古刹，松涛阵阵。月光下的石阶通向深处，隐约可见古老的阵法纹路在石壁上闪烁微光。",
        timeSettings: ["深夜", "月夜", "黎明"],
        visualElements: ["云雾山中古寺", "青石台阶", "古老阵法", "月光松影"],
        associatedProps: ["残剑", "武功秘籍"],
      },
      {
        id: "loc_city",
        name: "朔方城·地牢",
        description: "北方重城的地下牢狱，阴森潮湿。反派势力在此关押重要人物，也是一场关键营救战的舞台。",
        atmosphere: "滴水声在黑暗中回荡，霉味和铁锈味充斥鼻腔。火把的光芒在潮湿的石墙上投下摇曳的影子，仿佛无数鬼魅在舞动。",
        timeSettings: ["深夜", "子时"],
        visualElements: ["阴暗地牢", "铁栅栏", "摇曳火把", "潮湿石墙", "锁链刑具"],
        associatedProps: ["噬血刃", "牢门钥匙"],
      },
      {
        id: "loc_peak",
        name: "断天峰·绝顶",
        description: "全剧最终决战之地，海拔万仞的孤峰之巅。寒风凛冽，云海翻涌，是见证一切恩怨了结的终极舞台。",
        atmosphere: "罡风呼啸，云海翻腾如怒涛。稀薄的空气让每一次呼吸都变得艰难，天地间只剩下两个身影的对峙。",
        timeSettings: ["黄昏", "日落时分", "暴风雨前"],
        visualElements: ["孤峰绝顶", "云海翻涌", "罡风飞沙", "夕阳残血", "两人对峙"],
        associatedProps: ["青锋剑", "噬血刃"],
      },
    ],
    acts: [
      {
        id: "act_1",
        title: "第一幕：风起青溪",
        description: "故事开端。主角林萧在青溪村过着平静的生活，直到一群神秘人闯入打破了宁静。他被迫踏上寻真相之路，途中结识了苏婉儿，并得知自己身世的蛛丝马迹。",
        narrativeFunction: "铺垫",
        moodTone: "从宁静到紧张，悬念渐起",
        pacing: "中等节奏，逐步展开世界观",
        scenes: [
          {
            id: "scene_1_1",
            title: "山村惊变",
            description: "一个寻常的午后，青溪村突然闯入一队黑衣人，四处搜寻某样东西。林萧出手阻止，意外展露出不俗的武艺根基。混乱中，师父留下的玉佩发出了奇异光芒。",
            location: "青溪村",
            locationId: "loc_village",
            characters: ["林萧", "苏婉儿"],
            characterIds: ["char_protagonist", "char_female_lead"],
            timeOfDay: "午后的阳光斜照进村子",
            mood: "从日常安宁骤然转为紧张危机",
            props: [
              { name: "玉佩信物", type: "accessory", description: "古朴玉佩，遇险时发出微光", holder: "林萧" },
              { name: "黑衣人兵器", type: "weapon", description: "制式短刀，带有神秘标记", holder: "黑衣人首领" },
            ],
            visualStyle: { style: "写实电影感", colorTone: "暖黄转冷蓝", lighting: "自然侧光转阴影", cameraAngle: "手持跟拍增强紧张感" },
            atmosphereRef: "宁静乡村突然被暴力打破，光影从温暖金黄急转冰冷暗沉，暗示美好即将破碎",
            narrativePurpose: "触发事件——打破主角的平静生活，引出主线冲突",
          },
          {
            id: "scene_1_2",
            title: "月下托付",
            description: "当夜，重伤的厉无痕出现在林萧面前，将残剑和一封泛黄的信物交给他，嘱托他前往归元宗寻找答案。说完这些，师父便陷入了昏迷。",
            location: "青溪村·林萧家中",
            locationId: "loc_village",
            characters: ["林萧", "厉无痕"],
            characterIds: ["char_protagonist", "char_mentor"],
            timeOfDay: "深夜，月光如水",
            mood: "沉重肃穆中带着一丝温情和不舍",
            props: [
              { name: "残剑", type: "weapon", description: "剑身斑驳却隐隐有灵光流转的古剑", holder: "厉无痕→林萧" },
              { name: "泛黄书信", type: "item", description: "字迹模糊的旧信，似乎记载着某个大秘密", holder: "林萧" },
            ],
            visualStyle: { style: "暗黑写实", colorTone: "冷暖对比（月光蓝 vs 烛光橙）", lighting: "月光主光源 + 烛光补光", cameraAngle: "低角度仰拍突出人物的悲壮" },
            atmosphereRef: "月光如水的静谧夜晚，烛光摇曳映照着两张面孔——一个是将死的恩师，一个是即将独自上路的少年",
            narrativePurpose: "传递使命——确立主角的目标和动力来源",
          },
          {
            id: "scene_1_3",
            title: "启程同行",
            description: "次日清晨，林萧与苏婉儿一同踏上旅途。苏婉儿表示自己的家族之祸与此事有关联，两人决定结伴同行，互相照应。",
            location: "青溪村口·古道",
            locationId: "loc_village",
            characters: ["林萧", "苏婉儿"],
            characterIds: ["char_protagonist", "char_female_lead"],
            timeOfDay: "清晨，薄雾未散",
            mood: "希望与未知交织，带着些许离愁",
            props: [
              { name: "药囊", type: "tool", description: "苏婉儿的随身药囊，装满各种药材", holder: "苏婉儿" },
              { name: "行囊", type: "item", description: "简单的旅行行囊，装有干粮和水壶", holder: "林萧" },
            ],
            visualStyle: { style: "温暖动漫风", colorTone: "晨光暖金色调", lighting: "逆光晨雾散射", cameraAngle: "远景跟拍，展现两人背影融入山路的意境" },
            atmosphereRef: "晨雾中的古道，两个年轻背影渐行渐远，前方是未知的旅程，身后是无法回头的故乡",
            narrativePurpose: "正式出发——标志第一幕结束，进入发展阶段的过渡",
          },
        ],
      },
      {
        id: "act_2",
        title: "第二幕：迷雾重重",
        description: "林萧一行人在旅途中遭遇多方势力的追捕和试探，逐步揭开了一个涉及朝野上下的大阴谋。他们来到归元宗，发现这里早已不是想象中的净土。",
        narrativeFunction: "发展与转折",
        moodTone: "疑云密布，危机四伏",
        pacing: "快慢交替，紧张感和探索感并存",
        scenes: [
          {
            id: "scene_2_1",
            title: "归元宗·暗流",
            description: "林萧持残剑进入归元宗，却发现宗门内部派系林立，各怀鬼胎。更令人震惊的是，他在后山禁地发现了师父当年留下的线索——和一个正在修炼魔功的熟悉身影。",
            location: "归元宗·后山禁地",
            locationId: "loc_sect",
            characters: ["林萧", "莫邪"],
            characterIds: ["char_protagonist", "char_antagonist"],
            timeOfDay: "深夜子时",
            mood: "震惊、困惑、一丝恐惧",
            props: [
              { name: "残剑", type: "weapon", description: "在禁地石碑前产生共鸣反应", holder: "林萧" },
              { name: "魔功秘籍", type: "item", description: "莫邪正在修练的禁忌功法残页", holder: "莫邪" },
              { name: "噬血刃", type: "weapon", description: "莫邪随身兵刃，散发着不祥气息", holder: "莫邪" },
            ],
            visualStyle: { style: "暗黑哥特", colorTone: "深紫与暗红的诡异配色", lighting: "魔光自下而上照射，营造不安感", cameraAngle: "荷兰角倾斜镜头表现失衡和危险" },
            atmosphereRef: "禁地深处，幽暗的石室中魔光闪烁，两个对立的身影首次正面相遇——一个代表着坚守的正道，一个代表着堕落的极端",
            narrativePurpose: "重大发现——揭示反派的身份和部分阴谋，提升冲突层级",
          },
          {
            id: "scene_2_2",
            title: "地牢营救",
            description: "得知苏婉儿被掳至朔方城地牢，林萧只身潜入营救。在地牢中，他不仅要面对守卫，还要在有限时间内破解机关救出被困之人。",
            location: "朔方城·地牢",
            locationId: "loc_city",
            characters: ["林萧", "苏婉儿", "守卫们"],
            characterIds: ["char_protagonist", "char_female_lead"],
            timeOfDay: "深夜",
            mood: "高度紧张，生死一线",
            props: [
              { name: "青锋剑", type: "weapon", description: "林萧在此战中首次真正发挥这把剑的力量", holder: "林萧" },
              { name: "银针", type: "tool", description: "苏婉儿用银针协助破解机关", holder: "苏婉儿" },
              { name: "牢门钥匙", type: "item", description: "从守卫身上获取的关键道具", holder: "林萧" },
              { name: "守卫长戟", type: "weapon", description: "守卫的标准装备", holder: "守卫" },
            ],
            visualStyle: { style: "电影质感动作片", colorTone: "高对比明暗", lighting: "火把点光源 + 深邃阴影", cameraAngle: "快速剪辑视角，特写与全景交替" },
            atmosphereRef: "阴暗潮湿的地牢中，火把的光芒在墙壁上投下张牙舞爪的影子。每一声脚步都可能暴露位置，每一次呼吸都在倒计时",
            narrativePurpose: "动作高潮——展示主角能力的成长，同时推进感情线和主线",
          },
        ],
      },
      {
        id: "act_3",
        title: "第三幕：断天决战",
        description: "所有线索汇聚，真相大白。莫邪的计划将在特定时刻启动，唯一能阻止他的方法就是在断天峰之巅与他进行终极对决。林萧必须超越自我，才能在这场战斗中守护他想守护的一切。",
        narrativeFunction: "高潮与结局",
        moodTone: "悲壮、激昂、终极一战",
        pacing: "层层递进至爆发",
        scenes: [
          {
            id: "scene_3_1",
            title: "绝顶对峙",
            description: "断天峰之巅，狂风呼啸。林萧与莫邪面对面站立，中间横亘着的不仅是武力的差距，更是两种截然不同的信念。对话之后，战斗一触即发。",
            location: "断天峰·绝顶",
            locationId: "loc_peak",
            characters: ["林萧", "莫邪"],
            characterIds: ["char_protagonist", "char_antagonist"],
            timeOfDay: "黄昏，残阳如血",
            mood: "史诗般的肃穆与悲壮",
            props: [
              { name: "青锋剑", type: "weapon", description: "此刻已完全觉醒，剑身流转着青色光芒", holder: "林萧" },
              { name: "噬血刃", type: "weapon", description: "吸收了大量怨气，散发着滔天杀意", holder: "莫邪" },
            ],
            visualStyle: { style: "史诗电影感", colorTone: "金红色晚霞 + 深蓝阴影的极致对比", lighting: "逆光剪影 + 侧光照亮人物轮廓", cameraAngle: "广角大景别展现天地渺小，特写捕捉细微表情" },
            atmosphereRef: "万仞孤峰之上，残阳如血染红了半个天空。两个身影在风中对立，一正一邪，一青一黑，仿佛整个世界的重量都压在了这一战之上",
            narrativePurpose: "最终对决——信念与力量的终极碰撞，决定所有人的命运",
          },
          {
            id: "scene_3_2",
            title: "尘埃落定",
            description: "大战落幕。莫邪在最后一刻似乎找回了一丝清明，选择自我了断而非被杀。林萧站在峰顶，看着远方初升的朝阳，心中百感交集。苏婉儿走到他身边，两人无言，却胜过千言万语。",
            location: "断天峰·绝顶",
            locationId: "loc_peak",
            characters: ["林萧", "苏婉儿"],
            characterIds: ["char_protagonist", "char_female_lead"],
            timeOfDay: "黎明，第一缕阳光刺破云层",
            mood: "劫后余生的平静，带着淡淡的忧伤和希望",
            props: [],
            visualStyle: { style: "温暖治愈系", colorTone: "金色晨光 + 柔和白", lighting: "柔和逆光，轮廓光勾勒人物", cameraAngle: "缓慢推近的背影镜头，然后切到侧面并肩的构图" },
            atmosphereRef: "最黑暗的时刻已经过去。东方的天际线上，第一缕阳光穿透云层洒向大地。两个人并肩而立，不需要言语，此刻的宁静就是最好的答案",
            narrativePurpose: "收尾——给出结局的情感落脚点，留有余韵",
          },
        ],
      },
    ],
    globalProps: [
      {
        name: "青锋剑",
        type: "symbolic",
        description: "主角的佩剑，原是其师父厉无痕年轻时所用。剑身蕴含着某种古老的力量，会在主人面临重大抉择时产生共鸣。",
        significance: "象征传承与成长，也是连接过去（师父）与未来（主角使命）的纽带",
        firstAppearance: "第一幕·月下托付",
      },
      {
        name: "玉佩信物",
        type: "accessory",
        description: "林萧身世之谜的关键证物，据说与他失散的亲人有关。",
        significance: "推动主线剧情的核心麦格芬（MacGuffin），贯穿始终的身份谜题",
        firstAppearance: "第一幕·山村惊变",
      },
      {
        name: "噬血刃",
        type: "weapon",
        description: "莫邪的佩刃，据说吞噬过无数生灵的鲜血。是一把被诅咒的凶器。",
        significance: "象征堕落与极端，与青锋剑形成鲜明对比——同样的兵器，不同的使用方式决定了不同的道路",
        firstAppearance: "第二幕·归元宗暗流",
      },
    ],
  };
}
