import bank from '../../lib/banks/politics-test.json';
import Practice from '../../components/Practice';
export const metadata={title:'Ôn tập nhận thức chính trị | Văn phòng'};
export default function PracticePage(){return <Practice questions={bank.questions}/>;}
