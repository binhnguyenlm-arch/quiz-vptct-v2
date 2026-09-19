import bank from './banks/politics-test.json';
export const topics = [
 {key:'politics',title:'Nhận thức chính trị',desc:'Bồi dưỡng bản lĩnh chính trị, nắm vững chủ trương, đường lối và nhiệm vụ của đơn vị.',count:bank.questions.length,tone:'red',icon:'★'},
 {key:'law',title:'Pháp luật, quy chế, quy định',desc:'Củng cố kiến thức pháp luật, quy chế và quy định của đơn vị; nâng cao ý thức chấp hành và vận dụng đúng trong thực hiện nhiệm vụ.',count:0,tone:'blue',icon:'⚖'},
 {key:'military',title:'Quân sự – Quốc phòng',desc:'Phổ biến, nâng cao kiến thức quân sự quốc phòng theo tình hình mới.',count:0,tone:'green',icon:'☆'},
 {key:'planning',title:'Nghiệp vụ Kế hoạch tổng hợp',desc:'Củng cố kỹ năng tham mưu, xây dựng kế hoạch, tổng hợp báo cáo và theo dõi thực hiện nhiệm vụ.',count:0,tone:'slate',icon:'✓'},
 {key:'relations',title:'Nghiệp vụ Đối ngoại',desc:'Bồi dưỡng kiến thức về công tác đối ngoại, lễ tân, giao tiếp và phối hợp trong quan hệ hợp tác.',count:0,tone:'indigo',icon:'◎'},
 {key:'archives',title:'Nghiệp vụ Văn thư lưu trữ',desc:'Nâng cao nghiệp vụ xử lý văn bản, lập hồ sơ, quản lý và bảo quản tài liệu lưu trữ.',count:0,tone:'teal',icon:'▤'},
] as const;
export type Topic = typeof topics[number];
