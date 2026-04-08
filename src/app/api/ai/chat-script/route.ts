/**
 * AI Chat for Script Adjustment API
 * POST /api/ai/chat-script - Chat with AI to adjust script analysis
 */

import { NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const { messages, currentAnalysis, storyId } = await request.json();

    if (!messages || !Array.isArray(messages) || !currentAnalysis) {
      return NextResponse.json(
        { error: "Messages and current analysis are required" },
        { status: 400 }
      );
    }

    // Prepare the system prompt
    const systemPrompt = `你是一个专业的剧本创作助手。用户正在通过对话调整剧本的分幕结构。

当前剧本分析数据：
${JSON.stringify(currentAnalysis, null, 2)}

你的任务是：
1. 理解用户的调整需求
2. 提供专业的建议
3. 如果用户要求修改，返回更新后的完整分析数据

回复格式：
{
  "message": "对用户的回复内容",
  "updatedAnalysis": { /* 如果需要修改，返回完整的更新后分析数据 */ }
}

注意：
- 只在你确认需要修改分幕结构时才返回 updatedAnalysis
- 保持JSON格式正确
- 对用户的调整建议要专业且具体`;

    // Call Deepseek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Deepseek API error:", errorData);
      
      // Fallback response
      return NextResponse.json({
        message: "我理解您的需求。请告诉我您希望如何调整分幕结构？例如：\n- 合并某些幕\n- 拆分某个场景\n- 调整场景顺序\n- 增加新的幕或场景",
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      // If not JSON, wrap in message field
      result = { message: aiResponse };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in chat:", error);
    
    return NextResponse.json({
      message: "抱歉，处理您的请求时出现错误。请重试或换一种方式描述您的需求。",
    });
  }
}
