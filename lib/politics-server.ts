import 'server-only';
import command from './banks/politics-command-2026.json';
import publicBank from './banks/politics-public-2026.json';
import {politicsAudiences,type PoliticsQuestion} from './politics-config';
export const politicsBanks:Record<string,{version:string;questions:PoliticsQuestion[]}>={command:command as unknown as {version:string;questions:PoliticsQuestion[]},public:publicBank as unknown as {version:string;questions:PoliticsQuestion[]}};
export const politicsCatalog=()=>politicsAudiences.map(a=>({...a,count:politicsBanks[a.id]?.questions.length||0,version:politicsBanks[a.id]?.version||'',ready:Boolean(politicsBanks[a.id])}));
