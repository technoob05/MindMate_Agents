import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Hàm để lưu dữ liệu onboarding
export async function POST(req: NextRequest) {
  try {
    // Đọc dữ liệu yêu cầu
    const { userId, answers } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Đường dẫn đến file graphdtb.json để lưu câu trả lời
    const filePath = path.join(process.cwd(), 'graphdtb.json');

    // Đọc nội dung hiện tại của file
    let graphData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      graphData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading graphdtb.json:', error);
      // Nếu file không tồn tại hoặc không hợp lệ, tạo cấu trúc mới
      graphData = {
        questionGroups: [],
        questions: [],
        userAnswers: []
      };
    }

    // Đảm bảo rằng có mảng userAnswers
    if (!graphData.userAnswers) {
      graphData.userAnswers = [];
    }

    // Kiểm tra xem người dùng đã có câu trả lời chưa
    const existingAnswerIndex = graphData.userAnswers.findIndex(
      (answer: any) => answer.userId === userId
    );

    // Nếu đã có, cập nhật câu trả lời hiện có
    if (existingAnswerIndex >= 0) {
      graphData.userAnswers[existingAnswerIndex] = {
        userId,
        answers,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Nếu chưa có, thêm câu trả lời mới
      graphData.userAnswers.push({
        userId,
        answers,
        createdAt: new Date().toISOString()
      });
    }

    // Ghi dữ liệu trở lại file
    fs.writeFileSync(filePath, JSON.stringify(graphData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return NextResponse.json(
      { message: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
} 