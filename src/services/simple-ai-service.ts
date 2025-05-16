import { sleep } from '@/lib/utils';

export interface AIResponse {
  text: string;
  sourceDocs?: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
  reasoningSteps?: Array<{
    type: 'thinking' | 'analysis' | 'conclusion';
    content: string;
  }>;
}

// This service simulates RAG steps but actually just uses a simple AI API call
export async function getAIResponse(
  userMessage: string, 
  onStepChange: (step: 'analyzing' | 'searching' | 'retrieving' | 'generating' | 'completed' | null) => void,
  useReasoning: boolean = false
): Promise<AIResponse> {
  try {
    if (!useReasoning) {
      // Standard RAG process simulation (already implemented)
      onStepChange('analyzing');
      await sleep(1000 + Math.random() * 1000); // 1-2 seconds for analysis
      
      onStepChange('searching');
      await sleep(1500 + Math.random() * 1500); // 1.5-3 seconds for searching
      
      onStepChange('retrieving');
      await sleep(1000 + Math.random() * 2000); // 1-3 seconds for retrieval
      
      onStepChange('generating');
      await sleep(2000 + Math.random() * 3000); // 2-5 seconds for generating

      // Actually just call a simple AI API here instead of a complex RAG process
      // Here we would call our actual AI endpoint
      const response = await callAIService(userMessage);
      
      onStepChange('completed');
      await sleep(500); // Brief pause before showing the response
      
      onStepChange(null); // Clear the RAG display

      // For the demo, we'll always include some fake source documents
      const fakeSourceDocs = generateFakeSourceDocs();
      
      return {
        text: response,
        sourceDocs: userMessage.length > 10 ? fakeSourceDocs : undefined // Only include sources for longer queries
      };
    } else {
      // Reasoning process simulation
      onStepChange('analyzing');
      await sleep(1500); // Initial analysis delay
      
      // Generate reasoning steps
      const reasoningSteps = generateReasoningSteps(userMessage);
      
      onStepChange('generating');
      await sleep(1000);
      
      // Get response from AI service (same as standard call)
      const response = await callAIService(userMessage, true);
      
      onStepChange('completed');
      await sleep(500);
      
      onStepChange(null); // Clear the RAG display
      
      return {
        text: response,
        reasoningSteps: reasoningSteps
      };
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    onStepChange(null);
    throw error;
  }
}

// A simple function to call whatever AI service you want to use for the demo
async function callAIService(userMessage: string, isReasoning: boolean = false): Promise<string> {
  try {
    // This is a placeholder - in a real app, you would call your AI service API
    // Example with Gemini API:
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || '';
    
    // Just use a local implementation for the demo if no API key is available
    if (!apiKey) {
      return isReasoning ? generateReasoningResponse(userMessage) : generateLocalResponse(userMessage);
    }

    const systemPrompt = isReasoning 
      ? `Bạn là MindMate, một trợ lý tâm lý ảo thông minh và đồng cảm với khả năng suy luận mạnh mẽ.`
      : `Bạn là MindMate, một trợ lý tâm lý ảo thông minh và đồng cảm.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt} Trả lời tin nhắn sau đây một cách chi tiết và hữu ích: "${userMessage}"`
              }
            ]
          }
        ]
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling AI service:', error);
    // Fallback to local response generation
    return generateLocalResponse(userMessage);
  }
}

// Fallback function to generate responses locally without an API
function generateLocalResponse(userMessage: string): string {
  const responses = [
    "Tôi hiểu cảm xúc mà bạn đang trải qua. Đôi khi chúng ta cần thời gian để xử lý những cảm giác phức tạp. Bạn có thể thử các bài tập thư giãn như hít thở sâu hoặc thiền định ngắn để giúp tâm trí bình tĩnh hơn.",
    "Cảm ơn bạn đã chia sẻ điều này. Việc nhận ra và chấp nhận cảm xúc của mình là bước đầu tiên quan trọng. Bạn có thể thử viết nhật ký để theo dõi cảm xúc và xác định các yếu tố kích hoạt.",
    "Điều bạn đang trải qua là hoàn toàn bình thường. Nhiều người cũng có những trải nghiệm tương tự. Hãy nhớ rằng việc tìm kiếm sự hỗ trợ - dù là từ bạn bè, gia đình, hay chuyên gia - luôn là dấu hiệu của sức mạnh, không phải yếu đuối.",
    "Cách bạn đối phó với tình huống này thể hiện sự kiên cường đáng khâm phục. Hãy tiếp tục thực hành các kỹ thuật chăm sóc bản thân và đặt ra những ranh giới lành mạnh trong các mối quan hệ.",
    "Tôi nghe thấy nỗi lo lắng trong câu hỏi của bạn, và điều đó hoàn toàn có thể hiểu được. Hãy thử phương pháp 5-4-3-2-1: xác định 5 thứ bạn nhìn thấy, 4 thứ bạn có thể chạm vào, 3 thứ bạn nghe thấy, 2 thứ bạn ngửi thấy, và 1 thứ bạn nếm được. Kỹ thuật này có thể giúp đưa bạn về với hiện tại khi lo lắng."
  ];
  
  // Use a hash of the user message to consistently return the same response for the same input
  const hash = userMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % responses.length;
  
  return responses[index];
}

// Generate more detailed and thoughtful responses for reasoning mode
function generateReasoningResponse(userMessage: string): string {
  const reasoningResponses = [
    "Từ câu hỏi của bạn, tôi nhận thấy có một số yếu tố cần xem xét. Thứ nhất, cảm giác lo lắng mà bạn đang trải qua có thể liên quan đến nhiều nguồn gốc khác nhau, bao gồm cả sinh lý và tâm lý. Nghiên cứu cho thấy rằng kỹ thuật thở sâu và thiền chánh niệm có thể kích hoạt phản ứng thư giãn của cơ thể, giúp giảm hormone căng thẳng như cortisol và adrenaline. Việc thực hành đều đặn có thể tạo ra những thay đổi lâu dài trong cách não bộ phản ứng với căng thẳng. Tôi khuyên bạn nên thử kỹ thuật 4-7-8: hít vào trong 4 giây, giữ hơi trong 7 giây, và thở ra trong 8 giây. Thực hiện 3-4 lần mỗi khi cảm thấy lo lắng.",

    "Từ thông tin bạn chia sẻ, tôi nhận thấy có dấu hiệu của một kiểu tư duy tiêu cực được gọi là 'nhận thức thảm họa' - xu hướng tưởng tượng kịch bản xấu nhất có thể xảy ra. Liệu pháp nhận thức hành vi (CBT) đã chứng minh hiệu quả trong việc giúp nhận diện và thách thức những mẫu tư duy này. Khi những suy nghĩ tiêu cực xuất hiện, hãy thử đặt câu hỏi: 'Đâu là bằng chứng ủng hộ và phản bác suy nghĩ này?', 'Nếu một người bạn gặp tình huống tương tự, mình sẽ nói gì với họ?', và 'Kết quả tồi tệ nhất, tốt nhất và thực tế nhất có thể xảy ra là gì?'. Thực hành thường xuyên sẽ giúp bạn phát triển thói quen nhìn nhận tình huống cân bằng và thực tế hơn.",

    "Phân tích vấn đề của bạn, tôi thấy có sự kết hợp giữa các yếu tố quan hệ và cảm xúc cá nhân. Các nhà nghiên cứu về gắn bó tình cảm như John Bowlby và Mary Ainsworth đã chỉ ra rằng những trải nghiệm từ thời thơ ấu có thể ảnh hưởng đến cách chúng ta hình thành mối quan hệ khi trưởng thành. Việc bạn cảm thấy khó thiết lập ranh giới có thể liên quan đến nhu cầu được chấp nhận hoặc nỗi sợ bị từ chối. Tôi gợi ý bạn thử tập thiết lập ranh giới nhỏ trước trong các tình huống ít rủi ro, sau đó dần dần áp dụng trong những tình huống thách thức hơn. Và hãy nhớ rằng, thực hành tự chăm sóc bản thân không phải là ích kỷ mà là cần thiết cho sức khỏe tinh thần của bạn."
  ];
  
  // Use a hash of the user message to consistently return the same response for the same input
  const hash = userMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % reasoningResponses.length;
  
  return reasoningResponses[index];
}

// Generate fake source documents for the RAG simulation
function generateFakeSourceDocs() {
  const sources = [
    {
      pageContent: "Các nghiên cứu gần đây cho thấy thiền định chánh niệm có thể giảm đáng kể mức độ căng thẳng và lo âu ở người trưởng thành. Thực hành đều đặn 10-15 phút mỗi ngày trong 8 tuần có thể tạo ra những thay đổi đo lường được trong hoạt động não. Trong một nghiên cứu năm 2019, các nhà khoa học tại Đại học Harvard đã ghi nhận sự thay đổi trong vùng hồi hải mã và vỏ não trước trán - những khu vực liên quan đến điều chỉnh cảm xúc và tập trung chú ý.",
      metadata: {
        source: "Tạp chí Thần kinh học Lâm sàng, 2022",
        page: 42,
        relevanceScore: 0.92,
        author: "TS. Nguyễn Văn Minh và cộng sự",
        url: "https://example.com/clinical-neuroscience"
      }
    },
    {
      pageContent: "Kỹ thuật thở sâu kích hoạt hệ thần kinh phó giao cảm, giúp cơ thể chuyển từ trạng thái 'chiến đấu hoặc bỏ chạy' sang trạng thái 'nghỉ ngơi và tiêu hóa'. Điều này có thể giúp giảm nhịp tim, huyết áp và mức cortisol. Các thử nghiệm lâm sàng cho thấy kỹ thuật hít thở 4-7-8 (hít vào trong 4 giây, giữ hơi trong 7 giây và thở ra từ từ trong 8 giây) có hiệu quả đặc biệt trong việc giảm phản ứng căng thẳng cấp tính chỉ sau 5 phút thực hiện.",
      metadata: {
        source: "Sổ tay các kỹ thuật điều chỉnh cảm xúc, Nhà xuất bản Y học",
        page: 17,
        relevanceScore: 0.95,
        author: "PGS.TS. Trần Thị Hoa",
        url: "https://example.com/emotion-regulation"
      }
    },
    {
      pageContent: "Liệu pháp nhận thức hành vi (CBT) tập trung vào việc xác định và thách thức các suy nghĩ tiêu cực và không hợp lý. Bằng cách thay đổi các mẫu suy nghĩ này, cá nhân có thể phát triển phản ứng cảm xúc và hành vi lành mạnh hơn. Theo nghiên cứu của Viện Sức khỏe Tâm thần Quốc gia Hoa Kỳ, CBT có hiệu quả khoảng 70% trong điều trị rối loạn lo âu và trầm cảm nhẹ đến trung bình, và hiệu quả của nó kéo dài lâu hơn so với chỉ sử dụng thuốc đơn thuần.",
      metadata: {
        source: "Nền tảng của Tâm lý trị liệu hiện đại, Nhà xuất bản Khoa học Xã hội",
        page: 103,
        relevanceScore: 0.88,
        author: "GS. Lê Văn Thành",
        url: "https://example.com/modern-psychotherapy"
      }
    },
    {
      pageContent: "Mô hình năm yếu tố về chánh niệm của Baer và cộng sự (2006) xác định các thành phần chính: quan sát, mô tả, hành động có ý thức, không phán xét và không phản ứng. Thực hành chánh niệm thường xuyên có thể cải thiện khả năng điều chỉnh cảm xúc thông qua việc tăng cường khả năng nhận biết và chấp nhận trải nghiệm mà không đánh giá hay phản ứng tức thời.",
      metadata: {
        source: "Tạp chí Tâm lý học Tích cực, Đại học Stanford",
        page: 78,
        relevanceScore: 0.85,
        author: "TS. Phạm Thị Thanh Hương",
        url: "https://example.com/positive-psychology"
      }
    },
    {
      pageContent: "Các nghiên cứu về tác động sinh lý của giao tiếp phi bạo lực (NVC) cho thấy khi con người sử dụng ngôn ngữ đồng cảm và không phán xét, mức độ hormone oxytocin (hormone gắn kết) tăng lên, trong khi cortisol (hormone căng thẳng) giảm xuống. Điều này giúp cải thiện chất lượng mối quan hệ và sức khỏe tâm lý tổng thể.",
      metadata: {
        source: "Giao tiếp và Sức khỏe Tâm lý, Đại học California",
        page: 156,
        relevanceScore: 0.79,
        author: "GS. Đặng Hoàng Minh",
        url: "https://example.com/communication-psychology"
      }
    },
    {
      pageContent: "Khái niệm 'Tâm trí bắt đầu' (Beginner's Mind) trong thiền Zen khuyến khích chúng ta tiếp cận mọi trải nghiệm với sự tò mò và cởi mở, như thể đang trải nghiệm lần đầu tiên. Cách tiếp cận này có thể giúp phá vỡ các khuôn mẫu tư duy cứng nhắc đã hình thành theo thời gian và thúc đẩy sự sáng tạo cũng như khả năng thích ứng.",
      metadata: {
        source: "Thiền định trong đời sống hiện đại, NXB Tri thức",
        page: 42,
        relevanceScore: 0.78,
        author: "Thiền sư Thích Nhất Hạnh",
        url: "https://example.com/modern-meditation"
      }
    }
  ];
  
  // Return 2-4 random sources for more impressive display
  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...sources].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate reasoning steps for the reasoning mode
function generateReasoningSteps(userMessage: string) {
  // Create some predefined reasoning steps for different types of questions
  const reasoningTemplates = [
    // Template 1: Anxiety and stress
    [
      {
        type: 'thinking',
        content: 'Đầu tiên, tôi cần xác định vấn đề chính mà người dùng đang gặp phải. Từ nội dung câu hỏi, có vẻ như đây là vấn đề liên quan đến lo âu hoặc căng thẳng. Người dùng đang tìm kiếm các phương pháp để đối phó với những cảm xúc tiêu cực này.'
      },
      {
        type: 'analysis',
        content: 'Nghiên cứu về sinh lý thần kinh cho thấy lo âu kích hoạt hệ thống thần kinh giao cảm, gây ra phản ứng "chiến đấu hoặc bỏ chạy". Điều này dẫn đến các triệu chứng như tim đập nhanh, hơi thở gấp, căng cơ và thay đổi hóa học não bộ (tăng cortisol, giảm serotonin).\n\nKỹ thuật thở sâu có thể kích hoạt hệ thần kinh phó giao cảm, đối kháng với phản ứng căng thẳng và đưa cơ thể về trạng thái cân bằng. Đặc biệt kỹ thuật 4-7-8 (hít vào 4 giây, giữ 7 giây, thở ra 8 giây) đã được nghiên cứu rộng rãi và chứng minh hiệu quả.'
      },
      {
        type: 'analysis',
        content: 'Ngoài các kỹ thuật thư giãn ngắn hạn, liệu pháp nhận thức hành vi (CBT) cũng rất hiệu quả trong việc giảm lo âu dài hạn. CBT tập trung vào việc xác định và thách thức các suy nghĩ tiêu cực tự động - những suy nghĩ này thường là nguyên nhân gốc rễ của lo âu.\n\nNghiên cứu của Đại học Pennsylvania (2018) chỉ ra rằng CBT có hiệu quả tương đương hoặc thậm chí vượt trội so với thuốc chống lo âu trong điều trị rối loạn lo âu, với tỷ lệ tái phát thấp hơn đáng kể sau khi ngừng điều trị.'
      },
      {
        type: 'conclusion',
        content: 'Dựa trên phân tích các nghiên cứu khoa học và hiệu quả đã được chứng minh, tôi sẽ đề xuất một cách tiếp cận toàn diện kết hợp:\n\n1. Các kỹ thuật thư giãn tức thời (thở sâu, thư giãn cơ tiến triển) để đối phó với các triệu chứng lo âu cấp tính\n2. Thực hành chánh niệm đều đặn để tăng cường khả năng điều chỉnh cảm xúc lâu dài\n3. Các kỹ thuật nhận thức hành vi để xác định và thách thức các suy nghĩ tiêu cực\n4. Tầm quan trọng của lối sống lành mạnh (giấc ngủ, dinh dưỡng, vận động)\n\nĐồng thời nhấn mạnh rằng đối với lo âu nghiêm trọng hoặc dai dẳng, sự hỗ trợ chuyên nghiệp luôn là lựa chọn tốt nhất.'
      }
    ],
    
    // Template 2: Relationship issues
    [
      {
        type: 'thinking',
        content: 'Từ câu hỏi của người dùng, tôi nhận thấy đây là vấn đề liên quan đến mối quan hệ cá nhân, cụ thể là khó khăn trong việc giao tiếp hoặc thiết lập ranh giới. Tôi cần phân tích các yếu tố tâm lý đằng sau những khó khăn này và đề xuất các giải pháp dựa trên nghiên cứu tâm lý học về mối quan hệ liên cá nhân.'
      },
      {
        type: 'analysis',
        content: 'Lý thuyết gắn bó (Attachment Theory) của John Bowlby và Mary Ainsworth giải thích rằng mô hình gắn bó mà chúng ta hình thành trong thời thơ ấu có ảnh hưởng sâu sắc đến cách chúng ta xây dựng và duy trì mối quan hệ khi trưởng thành.\n\nNghiên cứu của Hazan và Shaver (1987) đã mở rộng lý thuyết này vào mối quan hệ người lớn, xác định bốn kiểu gắn bó chính: an toàn, lo âu, né tránh, và sợ hãi-né tránh. Người có kiểu gắn bó lo âu thường sợ bị từ chối, có xu hướng phụ thuộc quá mức và khó thiết lập ranh giới lành mạnh.'
      },
      {
        type: 'analysis',
        content: 'Nghiên cứu dài hạn của John Gottman về các cặp đôi đã xác định các mô hình giao tiếp dự đoán sự thành công hoặc thất bại của mối quan hệ. Ông phát hiện ra "Bốn kỵ sĩ Khải Huyền" trong giao tiếp: chỉ trích, phòng thủ, khinh miệt và đóng cửa (stonewalling).\n\nNghiên cứu của viện Gottman chỉ ra rằng các mối quan hệ lành mạnh có tỷ lệ tương tác tích cực và tiêu cực là 5:1. Điều này có nghĩa là cần năm lần tương tác tích cực để bù đắp cho một lần tương tác tiêu cực để duy trì sự cân bằng cảm xúc trong mối quan hệ.'
      },
      {
        type: 'conclusion',
        content: 'Dựa trên phân tích các nghiên cứu tâm lý học về mối quan hệ, tôi sẽ đề xuất các chiến lược sau:\n\n1. Giao tiếp phi bạo lực (theo mô hình của Marshall Rosenberg): tập trung vào việc diễn đạt nhu cầu và cảm xúc cá nhân mà không đổ lỗi hoặc phê phán người khác\n\n2. Thiết lập ranh giới lành mạnh: bắt đầu với những ranh giới nhỏ trong các tình huống ít rủi ro, sau đó dần dần áp dụng trong những tình huống quan trọng hơn\n\n3. Phát triển nhận thức về kiểu gắn bó cá nhân: hiểu rõ mô hình gắn bó của bản thân và cách nó ảnh hưởng đến mối quan hệ\n\n4. Thực hành tự chăm sóc bản thân: xây dựng một bản sắc vững chắc bên ngoài mối quan hệ là nền tảng cho các mối quan hệ lành mạnh'
      }
    ],
    
    // Template 3: Self-esteem and personal growth
    [
      {
        type: 'thinking',
        content: 'Câu hỏi của người dùng liên quan đến vấn đề lòng tự trọng và phát triển bản thân. Tôi cần phân tích các yếu tố tâm lý ảnh hưởng đến lòng tự trọng, các nghiên cứu liên quan, và đề xuất các phương pháp khoa học để xây dựng sự tự tin lành mạnh và bền vững.'
      },
      {
        type: 'analysis',
        content: 'Lòng tự trọng thấp thường bắt nguồn từ hệ thống niềm tin nội tâm tiêu cực về bản thân. Theo lý thuyết nhận thức của Aaron Beck, những niềm tin cốt lõi này hình thành từ sớm qua trải nghiệm sống, đặc biệt là trong quá trình phát triển thời thơ ấu, và có thể bị ảnh hưởng bởi phong cách nuôi dạy, trải nghiệm tiêu cực, hoặc các chấn thương.\n\nNghiên cứu về tâm lý học tích cực của Martin Seligman cho thấy việc xác định và phát huy điểm mạnh cá nhân thay vì chỉ tập trung vào việc khắc phục điểm yếu có thể mang lại những cải thiện đáng kể về lòng tự trọng và hạnh phúc tổng thể.'
      },
      {
        type: 'analysis',
        content: 'Khái niệm "tự đồng cảm" (self-compassion) được phát triển bởi Kristin Neff đề xuất một cách tiếp cận lành mạnh hơn đối với lòng tự trọng. Neff đề xuất ba yếu tố của tự đồng cảm: sự tử tế với bản thân (thay vì tự phê bình), nhận thức về tính chung của con người (thay vì cô lập), và chánh niệm (thay vì quá đồng nhất với cảm xúc tiêu cực).\n\nCác nghiên cứu so sánh tự đồng cảm với lòng tự trọng truyền thống cho thấy tự đồng cảm ít phụ thuộc vào thành tích bên ngoài, ít gây ra so sánh xã hội, và có liên quan đến sức khỏe tâm lý tích cực lâu dài hơn.'
      },
      {
        type: 'conclusion',
        content: 'Dựa trên phân tích các nghiên cứu tâm lý học hiện đại về lòng tự trọng và phát triển cá nhân, tôi sẽ đề xuất một cách tiếp cận toàn diện bao gồm:\n\n1. Thực hành tự đồng cảm: phát triển thái độ tử tế và hiểu biết đối với bản thân, đặc biệt là trong những thời điểm khó khăn\n\n2. Nhận diện và thách thức tư duy tiêu cực: sử dụng kỹ thuật tái cấu trúc nhận thức để xác định và thay đổi niềm tin hạn chế\n\n3. Xây dựng dựa trên điểm mạnh: xác định và phát triển tài năng và phẩm chất cốt lõi thay vì chỉ tập trung vào điểm yếu\n\n4. Thiết lập mục tiêu có ý nghĩa: theo đuổi các mục tiêu phù hợp với giá trị cá nhân thay vì chỉ tìm kiếm sự công nhận bên ngoài\n\n5. Thực hành lòng biết ơn: ghi nhận thường xuyên những điều tích cực trong cuộc sống để xây dựng thái độ tích cực'
      }
    ],
    // Template 4: Sleep and rest
    [
      {
        type: 'thinking',
        content: 'Từ câu hỏi của người dùng, tôi hiểu rằng họ đang gặp khó khăn với giấc ngủ hoặc muốn cải thiện chất lượng nghỉ ngơi. Đây là một vấn đề sức khỏe tâm thần quan trọng, vì giấc ngủ có liên quan mật thiết đến sức khỏe tinh thần và thể chất. Tôi cần phân tích khoa học về giấc ngủ và các phương pháp được nghiên cứu để cải thiện chất lượng nghỉ ngơi.'
      },
      {
        type: 'analysis',
        content: 'Giấc ngủ đóng vai trò thiết yếu trong gần như mọi khía cạnh của sức khỏe não bộ. Nghiên cứu của Matthew Walker (Đại học Berkeley) cho thấy trong khi ngủ, não bộ củng cố trí nhớ, loại bỏ độc tố tích tụ trong ngày (thông qua hệ thống glymphatic), và tái cân bằng các chất dẫn truyền thần kinh.\n\nThiếu ngủ mạn tính có liên quan đến tăng nguy cơ trầm cảm, lo âu, suy giảm chức năng miễn dịch, và thậm chí các bệnh thoái hóa thần kinh dài hạn. Một nghiên cứu năm 2018 từ Đại học California chỉ ra rằng chỉ một đêm thiếu ngủ có thể làm tăng mức độ protein beta-amyloid, một dấu hiệu của bệnh Alzheimer.'
      },
      {
        type: 'analysis',
        content: 'Liệu pháp nhận thức hành vi cho chứng mất ngủ (CBT-I) đã được chứng minh là điều trị hiệu quả nhất cho chứng mất ngủ dai dẳng, thậm chí hiệu quả hơn thuốc ngủ trong dài hạn. Các thành phần chính của CBT-I bao gồm: hạn chế thời gian nằm trên giường, kiểm soát kích thích (chỉ sử dụng giường để ngủ), vệ sinh giấc ngủ, và kỹ thuật thư giãn.\n\nNghiên cứu của Viện Sức khỏe Quốc gia Hoa Kỳ (NIH) cho thấy việc duy trì lịch trình ngủ đều đặn giúp điều chỉnh đồng hồ sinh học (nhịp sinh học), tối ưu hóa chất lượng giấc ngủ và cải thiện tâm trạng. Mất cân bằng nhịp sinh học đã được liên kết với nhiều rối loạn tâm lý, bao gồm trầm cảm theo mùa và rối loạn lưỡng cực.'
      },
      {
        type: 'conclusion',
        content: 'Dựa trên phân tích khoa học về giấc ngủ và nghỉ ngơi, tôi sẽ đề xuất một phương pháp toàn diện gồm nhiều lớp để cải thiện chất lượng giấc ngủ:\n\n1. Vệ sinh giấc ngủ: tạo môi trường ngủ tối, mát và yên tĩnh; tránh caffeine, rượu và thiết bị điện tử trước khi ngủ; duy trì lịch trình ngủ đều đặn\n\n2. Kỹ thuật thư giãn trước khi ngủ: thở sâu, thư giãn cơ tiến triển, hoặc thiền chánh niệm để kích hoạt phản ứng thư giãn\n\n3. Giới hạn thời gian nằm trên giường: chỉ lên giường khi buồn ngủ và dậy nếu không ngủ được sau 20 phút\n\n4. Quản lý ánh sáng: tiếp xúc với ánh sáng tự nhiên vào buổi sáng và giảm ánh sáng xanh vào buổi tối để tối ưu hóa sản xuất melatonin\n\n5. Xem xét giải quyết các vấn đề sức khỏe tâm thần tiềm ẩn (lo âu, trầm cảm) nếu chúng đang góp phần gây ra vấn đề về giấc ngủ'
      }
    ]
  ];
  
  // Add more randomness by including different sub-topics based on message content
  let selectedTemplate;
  
  // In a real implementation, you would analyze message content to choose appropriate template
  // For demo purposes, base it on word patterns in the message
  const lowerMsg = userMessage.toLowerCase();
  
  if (lowerMsg.includes('lo âu') || lowerMsg.includes('căng thẳng') || lowerMsg.includes('sợ') || lowerMsg.includes('stress')) {
    selectedTemplate = reasoningTemplates[0];
  } else if (lowerMsg.includes('quan hệ') || lowerMsg.includes('mối quan hệ') || lowerMsg.includes('bạn') || lowerMsg.includes('người yêu') || lowerMsg.includes('gia đình')) {
    selectedTemplate = reasoningTemplates[1];
  } else if (lowerMsg.includes('tự tin') || lowerMsg.includes('phát triển') || lowerMsg.includes('bản thân') || lowerMsg.includes('yêu bản thân')) {
    selectedTemplate = reasoningTemplates[2];
  } else if (lowerMsg.includes('ngủ') || lowerMsg.includes('mất ngủ') || lowerMsg.includes('mệt') || lowerMsg.includes('nghỉ ngơi')) {
    selectedTemplate = reasoningTemplates[3];
  } else {
    // If no specific match, select randomly
    const hash = userMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const templateIndex = hash % reasoningTemplates.length;
    selectedTemplate = reasoningTemplates[templateIndex];
  }
  
  return selectedTemplate;
} 