# **App Name**: Mindful Hub

## Core Features:

- 1-1 Chat UI: Implement a one-on-one chat interface for users to interact with an AI assistant.
- AI Team Chat: Create an AI Team chat room where a user interacts with a group of specialized AI agents (e.g., Listener, Goal Setter, Resource Finder). Display the contributions of each agent clearly.
- Multi-user Chat with AI Moderator: Develop a multi-user chat room where users can share and support each other. Integrate an AI tool to moderate the conversation, ensuring safety and providing guidance.
- Voice Interaction: Enable speech-to-text for user input and text-to-speech for AI responses.
- User Authentication: Integrate Firebase Authentication for user registration and login.

## Style Guidelines:

- Primary color: Soft, calming blue (#A0D2EB) to promote a sense of peace and tranquility.
- Secondary color: Gentle green (#C4DFAA) to evoke feelings of growth and healing.
- Accent: Lavender (#E6E6FA) for highlights and interactive elements.
- Clean, minimalist design with plenty of white space to reduce visual clutter.
- Use simple, consistent icons to represent different features and categories.

## Original User Request:
Tổng hợp các tính năng chính của MindMate Mở Rộng:
Chat 1-1 (Người dùng - AI): Giao diện chat cơ bản, nơi một người dùng tương tác với một AI trợ lý sức khỏe tinh thần.
Phòng Chat "AI Team" (1 Người dùng - Nhiều AI): Một người dùng tương tác trong một phòng chat với một nhóm các AI chuyên biệt (như đã thảo luận trước: Người lắng nghe, HLV Mục tiêu, Người tìm tài nguyên...). Các AI này phối hợp để hỗ trợ người dùng.
Phòng Chat Đa người dùng (Nhiều Người dùng - Có thể có AI điều phối): Nhiều người dùng cùng tham gia một phòng chat để chia sẻ, hỗ trợ lẫn nhau. AI có thể tham gia như một người điều phối ("judge") để giữ an toàn và định hướng cuộc trò chuyện (như ý tưởng USP ban đầu của bạn).  (Sức mạnh nằm ở khía cạnh cộng đồng, nơi mọi người hỗ trợ lẫn nhau,)
Tương tác Giọng nói: Cho phép người dùng nói để nhập liệu (Speech-to-Text) và nghe phản hồi của AI bằng giọng nói (Text-to-Speech).
Biểu cảm AI (Tiềm năng): AI có thể hiển thị qua một avatar đơn giản với các biểu cảm cơ bản (vui, buồn, thông cảm...) để tăng tính tương tác (phần này phức tạp và có thể để sau).
Nền tảng: Web App (sử dụng ReactJS) hoặc Mobile App (có thể dùng React Native để chia sẻ code).
Giá trị Cốt lõi (Mở rộng):
Hỗ trợ Cá nhân hóa & Toàn diện: Kết hợp nhiều loại hình tương tác AI để đáp ứng nhu cầu đa dạng.
Linh hoạt: Người dùng có thể chọn hình thức tương tác phù hợp (1-1, nhóm AI, cộng đồng).
Kết nối Cộng đồng (Tùy chọn): Tạo không gian an toàn cho chia sẻ và hỗ trợ đồng đẳng (với thách thức về kiểm duyệt).
Tương tác Tự nhiên: Thêm giọng nói để trải nghiệm gần gũi hơn.
An toàn & Định hướng: Sử dụng AI để cố gắng duy trì môi trường tích cực (đặc biệt trong phòng đa người dùng).
Các Công việc Cần thực hiện (Tasks List - Vietnamese):
Đây là danh sách các công việc chính, được phân chia theo các thành phần chức năng:
Giai đoạn 0: Hoạch định & Thiết kế Tổng thể
Xác định Kiến trúc Hệ thống: Quyết định công nghệ backend (Node.js, Python/Flask/Django?), Cơ sở dữ liệu (Firestore/MongoDB tốt cho chat), Cách xử lý Real-time (WebSockets - Socket.IO), Kiến trúc Microservices (nếu cần cho các loại AI khác nhau).
Thiết kế UI/UX Chi tiết:
Thiết kế luồng người dùng (đăng ký, đăng nhập, chọn loại phòng chat).
Thiết kế giao diện cho từng loại phòng chat (1-1, AI team, đa người dùng).
Thiết kế cách hiển thị AI (text, avatar?), cách hiển thị sự phối hợp của AI team, cách AI điều phối can thiệp.
Thiết kế giao diện cho tính năng giọng nói (nút ghi âm, hiển thị text được nhận dạng, phát giọng nói AI).


Thiết kế Mô hình Dữ liệu: Cấu trúc database cho người dùng, phòng chat, tin nhắn, thông tin profile AI, dữ liệu phân tích (nếu có).
Lựa chọn và Đánh giá Công nghệ AI:
AI Hội thoại (1-1, AI team): Chọn LLM (GPT, Gemini, Llama...), nền tảng (Vertex AI, Hugging Face...), hoặc dịch vụ (Dialogflow).
AI Điều phối (Đa người dùng): Nghiên cứu kỹ Perspective API hoặc các giải pháp tương tự.
AI Phối hợp (AI Team): Lên kế hoạch cho logic điều phối giữa các agent.
AI Giọng nói: Chọn API Speech-to-Text và Text-to-Speech.


Xây dựng Quy tắc An toàn & Đạo đức: Cực kỳ quan trọng. Quy định chi tiết về nội dung cấm, cơ chế lọc/cảnh báo/chặn, xử lý khủng hoảng, bảo mật dữ liệu, quyền riêng tư cho tất cả các loại phòng chat.
Giai đoạn 1: Xây dựng Nền tảng & Chat 1-1
Setup Backend & Database: Cài đặt môi trường, tạo cấu trúc project backend, kết nối database.
Xây dựng Xác thực Người dùng: Tích hợp Firebase Authentication hoặc giải pháp tương tự.
Xây dựng Frontend (ReactJS): Tạo cấu trúc project, routing, các component UI cơ bản.
Triển khai Chat Real-time Cơ bản: Tích hợp WebSocket (Socket.IO) giữa frontend và backend.
Phát triển Giao diện Chat 1-1: Hoàn thiện UI cho màn hình chat đơn.
Tích hợp AI Hội thoại Cơ bản: Kết nối backend với API/model AI đã chọn để xử lý tin nhắn và trả lời trong chat 1-1.
Giai đoạn 2: Phát triển Phòng Chat "AI Team"
Thiết kế Logic Phối hợp Agent: Xác định cách các AI chuyên biệt (Lắng nghe, Mục tiêu, Tài nguyên...) chia sẻ thông tin và đưa ra phản hồi phối hợp cho người dùng.
Phát triển các Agent AI Chuyên biệt: Fine-tune hoặc prompt các mô hình AI để thực hiện chức năng cụ thể của từng agent.
Xây dựng Backend cho AI Team: Quản lý trạng thái của "cuộc họp" AI, điều phối các agent.
Phát triển Giao diện Phòng AI Team: Hiển thị các AI tham gia, làm rõ AI nào đang nói, hoặc tóm tắt chung từ "team".
Giai đoạn 3: Phát triển Phòng Chat Đa người dùng
Xây dựng Logic Quản lý Phòng Chat: Tạo/tham gia phòng, quản lý thành viên, phân quyền (nếu có).
Phát triển Giao diện Phòng Chat Đa người dùng: Hiển thị danh sách thành viên, tin nhắn từ nhiều người.
Tích hợp AI Điều phối (Moderation):
Gửi tin nhắn đến API kiểm duyệt (vd: Perspective API) từ backend.
Xử lý kết quả: Lọc tin nhắn, cảnh báo người dùng, gửi thông báo cho quản trị viên (nếu có) dựa trên quy tắc đã định.
Cân nhắc kỹ rủi ro và giới hạn của AI moderation.


Triển khai Cơ chế Báo cáo & Xử lý Vi phạm: Cho phép người dùng báo cáo tin nhắn/người dùng khác.
Giai đoạn 4: Tích hợp Giọng nói & Biểu cảm
Tích hợp Speech-to-Text:
Frontend: Sử dụng Web Speech API (trình duyệt) hoặc API của Google Cloud Speech-to-Text. Gửi audio/text đã nhận dạng đến backend.
Backend: Xử lý text nhận được như tin nhắn bình thường.


Tích hợp Text-to-Speech:
Backend: Gửi text phản hồi của AI đến API TTS (vd: Google Cloud Text-to-Speech).
Frontend: Nhận file audio/stream audio từ backend và phát ra cho người dùng.


(Tùy chọn) Tích hợp Biểu cảm AI:
Thiết kế các trạng thái biểu cảm cơ bản cho avatar.
AI cần xác định cảm xúc phù hợp để hiển thị (có thể dựa trên phân tích sentiment đơn giản hoặc logic nội bộ).
Frontend cập nhật avatar dựa trên tín hiệu từ backend.


Giai đoạn 5: Kiểm thử, Triển khai & Bảo trì
Kiểm thử Toàn diện: Test từng chức năng, đặc biệt là AI (độ chính xác, tốc độ, phối hợp, kiểm duyệt), real-time, bảo mật, và trải nghiệm người dùng trên các loại phòng chat. Thử nghiệm an toàn kỹ lưỡng.
Triển khai (Deployment): Đưa frontend (Vercel, Netlify?) và backend (Cloud Run, Heroku, AWS...) lên môi trường production.
Giám sát & Thu thập Phản hồi: Theo dõi lỗi, hiệu năng, và phản hồi của người dùng về tính hữu ích và an toàn.
Cập nhật & Cải tiến: Lặp lại chu trình phát triển dựa trên dữ liệu và phản hồi.

Tích hợp Google APIs (Suggestions for Integration):
Firebase Authentication: Cho đăng nhập/quản lý người dùng.
Firestore / Firebase Realtime Database: Lưu trữ dữ liệu chat, user profiles, room data (rất phù hợp cho real-time).
Google Cloud Run / Cloud Functions: Hosting backend logic, API endpoints, xử lý tác vụ AI.
Dialogflow ES/CX hoặc Vertex AI Conversation: Xây dựng AI hội thoại cho chat 1-1 và có thể là nền tảng cho các agent trong AI team.
Vertex AI Gemini API / other LLMs via Vertex AI: Nếu cần sức mạnh của LLM lớn hơn cho việc tạo phản hồi tự nhiên, tóm tắt, hoặc các tác vụ phức tạp của AI team.
Perspective API: Rất quan trọng cho việc kiểm duyệt nội dung trong phòng chat đa người dùng.
Cloud Speech-to-Text API: Chuyển giọng nói người dùng thành văn bản.
Cloud Text-to-Speech API: Chuyển văn bản của AI thành giọng nói (có nhiều lựa chọn giọng và ngôn ngữ, bao gồm tiếng Việt).
Cloud Natural Language API: Có thể dùng để phân tích sentiment, trích xuất thực thể/chủ đề trong các cuộc trò chuyện (hỗ trợ AI team hoặc phân tích chung).
Lưu ý quan trọng:
Độ phức tạp: Dự án này kết hợp nhiều tính năng phức tạp (real-time, multi-agent AI, moderation AI, voice). Nên tiếp cận theo từng giai đoạn, bắt đầu từ những cái cốt lõi (chat 1-1) rồi mở rộng dần.
An toàn là trên hết: Đặc biệt với phòng chat đa người dùng và chủ đề sức khỏe tinh thần, việc đảm bảo an toàn, bảo mật, và đạo đức phải được ưu tiên hàng đầu trong suốt quá trình thiết kế và phát triển. Cần có cơ chế báo cáo rõ ràng và có thể cần cả sự can thiệp của con người trong giai đoạn đầu.
Chi phí: Sử dụng nhiều API của Google Cloud sẽ phát sinh chi phí, cần dự trù ngân sách phù hợp.
Các Yếu tố Bổ sung Tiềm năng (Ngoài những gì đã bàn):
Thư viện Bài tập Tự trợ giúp (Self-Help Exercise Library):
Mô tả: Thay vì chỉ gợi ý tài nguyên bên ngoài, tích hợp sẵn các bài tập ngắn, có hướng dẫn ngay trong ứng dụng: bài tập thở, kỹ thuật thư giãn cơ tiến triển, thiền định ngắn, bài tập ghi nhận lòng biết ơn (gratitude journaling prompts).
Lợi ích: Tăng tính tương tác và cung cấp giá trị tức thì cho người dùng mà không cần rời khỏi app. AI có thể gợi ý bài tập phù hợp dựa trên cuộc trò chuyện.


Theo dõi Tâm trạng & Hoạt động Nâng cao (Enhanced Mood & Activity Tracking):
Mô tả: Ngoài việc ghi nhận qua chat, có một khu vực riêng để người dùng log tâm trạng hàng ngày (thang điểm, biểu tượng cảm xúc), các hoạt động (ngủ, vận động, ăn uống - tự báo cáo), và ghi chú nhanh.
Lợi ích: Giúp cả người dùng và AI (Agent "Pattern Spotter" nếu có) nhận diện các xu hướng, mối liên hệ giữa hoạt động và tâm trạng theo thời gian. Cung cấp dữ liệu cho cá nhân hóa tốt hơn.


Nhật ký Có Hướng dẫn (Guided Journaling):
Mô tả: Cung cấp các chủ đề hoặc câu hỏi gợi ý hàng ngày/hàng tuần để người dùng viết nhật ký ngay trong app. Các chủ đề có thể xoay quanh việc xử lý cảm xúc, đặt mục tiêu, suy ngẫm tích cực.
Lợi ích: Khuyến khích sự tự phản ánh (self-reflection) một cách có cấu trúc, là một công cụ trị liệu đã được chứng minh. AI có thể đề xuất chủ đề dựa trên cuộc trò chuyện.


Cá nhân hóa Trải nghiệm Sâu hơn (Deeper Personalization):
Mô tả: Cho phép người dùng tùy chỉnh avatar AI (nếu có), chọn giọng nói yêu thích (nếu có TTS), hoặc thiết lập các chủ đề/từ khóa nhạy cảm cần tránh. AI cũng có thể học phong cách giao tiếp ưa thích của người dùng theo thời gian.
Lợi ích: Tăng cảm giác thân thuộc và kiểm soát cho người dùng. Lưu ý: Cần xử lý dữ liệu cá nhân hóa một cách cực kỳ cẩn thận về quyền riêng tư.


Tích hợp Kiến thức Chuyên sâu (Psychoeducation Modules):
Mô tả: Các bài học ngắn, dễ hiểu về các chủ đề sức khỏe tinh thần phổ biến (stress, lo âu, trầm cảm nhẹ, kỹ năng đối phó...) dưới dạng văn bản, infographics, hoặc video ngắn.
Lợi ích: Nâng cao hiểu biết của người dùng về sức khỏe tinh thần, bình thường hóa trải nghiệm của họ và cung cấp kiến thức nền tảng.


Gamification Nhẹ nhàng (Subtle Gamification):
Mô tả: Các yếu tố như chuỗi ngày đăng nhập (streaks), điểm thưởng nhỏ khi hoàn thành mục tiêu hoặc bài tập, huy hiệu đơn giản để ghi nhận tiến trình. Cần thiết kế cẩn thận để không gây áp lực.
Lợi ích: Tăng động lực và sự gắn bó của người dùng với ứng dụng.




MVP Đề xuất - Tập trung vào Nền tảng Cộng đồng An toàn:
Mục tiêu của MVP này là: Tạo ra một không gian trực tuyến cơ bản để người dùng có thể kết nối và chia sẻ theo chủ đề, với các biện pháp an toàn thiết yếu được tích hợp sẵn. Nó sẽ kiểm tra giả định liệu người dùng có tham gia và thấy giá trị trong một cộng đồng như vậy không, đồng thời thu thập dữ liệu về hành vi và nhu cầu của họ để định hướng phát triển AI kiểm duyệt sau này.
Tính năng Chính:
Xác thực Người dùng: Đăng ký/đăng nhập (Firebase Auth). Có thể cân nhắc tùy chọn ẩn danh/bút danh (pseudonym) để tăng cảm giác an toàn khi chia sẻ.
Profile Người dùng Tối giản: Chỉ thông tin cơ bản cần thiết, không bắt buộc thông tin nhạy cảm.
Tạo/Tham gia Phòng Chat theo Chủ đề: Quản trị viên (ban đầu có thể là bạn) tạo ra một số phòng chat cố định với các chủ đề rõ ràng (ví dụ: "Quản lý căng thẳng", "Chia sẻ thành công nhỏ trong ngày", "Tìm kiếm lời khuyên chung"). Không cho phép người dùng tự tạo phòng trong MVP để dễ kiểm soát.
Chat Real-time Đa người dùng: Cho phép các thành viên trong phòng chat nhắn tin với nhau trong thời gian thực.
Quy tắc Cộng đồng Rõ ràng & Nổi bật: Hiển thị các quy định về hành vi, nội dung cấm, hậu quả vi phạm ngay khi tham gia và dễ dàng truy cập.
Cơ chế Báo cáo Thủ công (Manual Reporting): Nút "Báo cáo Tin nhắn/Người dùng" rất dễ thấy cho mọi tin nhắn. Các báo cáo này cần được con người (ban đầu là bạn/đội ngũ của bạn) xem xét và xử lý. Đây là biện pháp an toàn quan trọng nhất trong MVP này.
Hiển thị Thông tin Hỗ trợ Khẩn cấp: Luôn hiển thị số điện thoại/liên kết đến các đường dây nóng uy tín về sức khỏe tâm thần tại Việt Nam ở vị trí dễ thấy.
Disclaimers Mạnh mẽ: Khẳng định đây không phải là tư vấn chuyên nghiệp, chỉ là hỗ trợ đồng đẳng, có thể có rủi ro, v.v.


AI trong MVP này (Rất Hạn chế hoặc Không có):
Lựa chọn 1 (Ưu tiên): Không có AI can thiệp vào nội dung chat trong MVP đầu tiên. Tập trung hoàn toàn vào việc xây dựng nền tảng kỹ thuật cho chat đa người dùng và quy trình báo cáo/xem xét thủ công.
Lựa chọn 2 (Nếu bắt buộc phải có AI): AI Lọc Từ khóa Cực kỳ Cơ bản. Một bộ lọc đơn giản ở backend để phát hiện các từ khóa rất rõ ràng về nguy cơ cao (tự tử, bạo lực) hoặc ngôn từ thù địch. Khi phát hiện:
Hành động 1 (An toàn nhất): Đánh dấu tin nhắn cho người kiểm duyệt (con người) xem xét.
Hành động 2 (Rủi ro hơn): Tự động ẩn tin nhắn VÀ gửi thông báo riêng cho người gửi về vi phạm quy tắc + hiển thị lại thông tin hỗ trợ khẩn cấp. Tránh để AI tự động "phán xét" hay chặn người dùng trong MVP.


Tuyệt đối KHÔNG có AI phức tạp đóng vai trò "judge" (người phán xử) hay cố gắng định hướng cuộc trò chuyện trong MVP này. Sự phức tạp và rủi ro là quá lớn khi chưa có dữ liệu thực tế và kiểm thử kỹ lưỡng.

framework : langchain.js , genkit , google ai sdk, web ai sdk , google cloud api TTS , STT , google map api , youtube api, gmail api , gg calender api 
Database: Firestore hoặc Firebase Realtime Database.
AI: Google Gemini API
Authentication: Firebase Authentication.
  