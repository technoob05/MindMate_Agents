import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CommunityGuidelinesPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-3 h-6 w-6 text-primary" />
            Quy tắc Cộng đồng MindMate Chat
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Cùng nhau xây dựng một không gian an toàn, tôn trọng và hỗ trợ lẫn nhau.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Nguyên tắc cốt lõi</h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li><span className="font-medium text-foreground">Tôn trọng & Tử tế:</span> Đối xử với mọi người bằng sự tôn trọng. Không có chỗ cho bắt nạt, quấy rối, ngôn từ thù địch dưới mọi hình thức.</li>
              <li><span className="font-medium text-foreground">Hỗ trợ & Xây dựng:</span> Chia sẻ mang tính xây dựng, tập trung vào việc hỗ trợ lẫn nhau. Tránh tiêu cực quá mức hoặc chỉ trích không mang lại giá trị.</li>
              <li><span className="font-medium text-foreground">An toàn & Bảo mật:</span> Không chia sẻ thông tin cá nhân nhạy cảm (địa chỉ, số điện thoại, v.v.). Tôn trọng quyền riêng tư của người khác.</li>
              <li><span className="font-medium text-foreground">Không phải tư vấn chuyên nghiệp:</span> Đây là không gian hỗ trợ đồng đẳng. Không đưa ra lời khuyên y tế hoặc tâm lý chuyên sâu. Khuyến khích tìm kiếm sự giúp đỡ từ chuyên gia khi cần thiết.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" /> Nội dung được khuyến khích
            </h2>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              <li>Chia sẻ kinh nghiệm cá nhân một cách tôn trọng.</li>
              <li>Đặt câu hỏi và tìm kiếm sự đồng cảm, lời khuyên (không chuyên môn).</li>
              <li>Cung cấp sự hỗ trợ, động viên cho người khác.</li>
              <li>Chia sẻ những thành công nhỏ, nguồn cảm hứng tích cực.</li>
              <li>Thảo luận về các phương pháp đối phó lành mạnh (ví dụ: thiền, chánh niệm, tập thể dục - nhưng không thay thế chỉ dẫn chuyên nghiệp).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" /> Nội dung bị cấm
            </h2>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              <li>Ngôn từ thù địch, phân biệt đối xử, quấy rối, bắt nạt.</li>
              <li>Nội dung khiêu dâm, tục tĩu quá mức.</li>
              <li>Mô tả chi tiết, đồ họa về bạo lực hoặc tự hại (có thể chia sẻ cảm xúc nhưng tránh chi tiết gây sốc).</li>
              <li>Spam, quảng cáo, chào mời dưới mọi hình thức.</li>
              <li>Mạo danh người khác.</li>
              <li>Chia sẻ thông tin sai lệch, đặc biệt là về sức khỏe.</li>
              <li>Đưa ra chẩn đoán hoặc lời khuyên y tế/trị liệu cụ thể.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" /> Báo cáo & Hậu quả
            </h2>
            <p className="text-muted-foreground mb-2">
              Nếu bạn thấy nội dung hoặc hành vi vi phạm quy tắc, vui lòng sử dụng nút "Báo cáo" trên tin nhắn. Đội ngũ quản trị viên (con người) sẽ xem xét các báo cáo.
            </p>
            <p className="text-muted-foreground">
              Vi phạm quy tắc có thể dẫn đến việc tin nhắn bị ẩn, cảnh cáo, hoặc tạm thời/vĩnh viễn bị cấm tham gia cộng đồng, tùy thuộc vào mức độ nghiêm trọng và lịch sử vi phạm.
            </p>
          </section>

           <div className="text-center pt-4">
             <Button asChild>
                <Link href="/multi-user-chat">Quay lại Chat</Link>
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
