const allowed=new Set(['/','/nhan-thuc-chinh-tri','/hoc-tap','/quan-tri-hoc-tap','/thi-dua-khen-thuong','/quan-tri-thi-dua','/to-chuc-quan-chung','/cong-cu/lich-ctd-ctct','/cong-cu/bao-ban-ngay','/cong-cu/tra-cuu','/on-tap','/thi-thu','/lich-cong-tac']);
export function loginDestination(value:string|null){
 if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/hoc-tap';
 try{const u=new URL(value,'https://office.invalid');if(u.origin!=='https://office.invalid'||(!allowed.has(u.pathname)&&!/^\/bo-de\/[0-9a-f-]{36}$/i.test(u.pathname)))return '/hoc-tap';return u.pathname+u.search+u.hash;}catch{return '/hoc-tap';}
}
export function loginHref(value:string){return '/dang-nhap?next='+encodeURIComponent(loginDestination(value));}

