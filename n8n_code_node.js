// ============================================================
// NODE: Code in JavaScript - Xử lý kết quả từ Google Gemini AI
// Bài tập 04 - N8N Workflow
// ============================================================

// 1. Lấy dữ liệu gốc từ Gemini AI trả về
const rawText = $input.first().json.content.parts[0].text;

// 2. Làm sạch chuỗi: loại bỏ markdown code block nếu có
let cleanText = rawText.trim();
if (cleanText.startsWith("```json")) {
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
} else if (cleanText.startsWith("```")) {
  cleanText = cleanText.replace(/^```\n?/, "").replace(/\n?```$/, "");
}

// 3. Chuyển đổi chuỗi JSON thành Object JavaScript
let cleanData;
try {
  cleanData = JSON.parse(cleanText);
} catch (e) {
  // Nếu AI không trả về JSON, tạo bài viết với nội dung thô
  return {
    title: "Bài viết tự động từ Telegram Bot",
    content: `<div class="auto-post">${rawText}</div>`,
  };
}

// 4. Trả về kết quả đã xử lý cho N8N
return {
  title: cleanData.post_title || cleanData.title || "Bài viết mới",
  content:
    cleanData.post_content ||
    cleanData.content ||
    cleanData.html ||
    rawText,
};
