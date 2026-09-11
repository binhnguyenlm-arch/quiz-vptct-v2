export const topics = [
 {key:'politics',title:'Nhận thức chính trị',desc:'Bồi dưỡng bản lĩnh chính trị, nắm vững chủ trương, đường lối và nhiệm vụ của đơn vị.',count:300,tone:'red',icon:'★'},
 {key:'law',title:'Pháp luật',desc:'Củng cố kiến thức pháp luật, nâng cao ý thức chấp hành kỷ luật trong công tác và cuộc sống.',count:250,tone:'blue',icon:'⚖'},
 {key:'military',title:'Quân sự – Quốc phòng',desc:'Nâng cao kiến thức quốc phòng, an ninh và tinh thần sẵn sàng thực hiện nhiệm vụ.',count:200,tone:'green',icon:'☆'},
] as const;
export type Topic = typeof topics[number];
export const ranking = [
 {name:'Nguyễn Văn An',topic:'politics',score:98,seconds:1935},
 {name:'Trần Thị Minh',topic:'law',score:97,seconds:2060},
 {name:'Lê Hoàng Nam',topic:'military',score:95,seconds:2178},
 {name:'Phạm Thúy Hằng',topic:'politics',score:94,seconds:2322},
 {name:'Đỗ Quốc Tùng',topic:'law',score:93,seconds:2411},
 {name:'Vũ Minh Quân',topic:'military',score:92,seconds:2280},
];
