import bank from './banks/politics-test.json';
export const topics = [
 {key:'politics',title:'Nhận thức chính trị',desc:'Bồi dưỡng bản lĩnh chính trị, nắm vững chủ trương, đường lối và nhiệm vụ của đơn vị.',count:bank.questions.length,tone:'red',icon:'★'},
 {key:'law',title:'Pháp luật',desc:'Củng cố kiến thức pháp luật, nâng cao ý thức chấp hành kỷ luật trong công tác và cuộc sống.',count:0,tone:'blue',icon:'⚖'},
 {key:'military',title:'Quân sự – Quốc phòng',desc:'Phổ biến, nâng cao kiến thức quân sự quốc phòng theo tình hình mới.',count:0,tone:'green',icon:'☆'},
] as const;
export type Topic = typeof topics[number];
