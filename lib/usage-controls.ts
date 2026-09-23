export const usageMessages:Record<string,string>={UPLOADS_PAUSED:'Quản trị viên đang tạm ngừng tải tệp lên. Vui lòng thử lại sau.',EXAMS_PAUSED:'Quản trị viên đang tạm ngừng mở bài thi mới. Bài đang làm vẫn được lưu và nộp.',EXAM_MONTH_LIMIT:'Đã đạt giới hạn lượt thi trong tháng do quản trị viên đặt.',PDF_FILE_LIMIT:'PDF vượt giới hạn dung lượng mỗi tệp do quản trị viên đặt.',PDF_STORAGE_LIMIT:'Đã đạt giới hạn dung lượng PDF cấp cho R2. Quản trị viên cần dọn tệp hoặc điều chỉnh giới hạn.',FORBIDDEN:'Chỉ quản trị viên được thay đổi giới hạn.'};
export async function usage(p:Record<string,unknown>={op:'get'}){
 const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('Chưa cấu hình kết nối.');
 const r=await fetch(base+'/rest/v1/rpc/web_usage',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 const data=await r.json();if(!r.ok)throw Error(usageMessages[data.message]||'Chưa đọc được giới hạn. Kiểm tra đã chạy SQL 015.');return data;
}
export async function requireUploads(){const d=await usage();if(d.settings.uploads_paused)throw Error(usageMessages.UPLOADS_PAUSED);return d;}
