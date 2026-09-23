import Link from 'next/link';
import styles from './SubsystemNav.module.css';

export default function SubsystemNav({to}:{to:'awards'|'community'}){
 const awards=to==='awards';
 return <nav className={styles.navigation} aria-label="Chuyển phân hệ">
  <Link href="/" className={styles.home}>← Trang chủ</Link>
  <Link href={awards?'/thi-dua-khen-thuong':'/to-chuc-quan-chung'} className={`${styles.destination} ${awards?styles.gold:styles.teal}`}>
   <span className={styles.icon} aria-hidden="true">{awards?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v5m-5 3h10m-8-3h6v3"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M5 5a3 3 0 0 0 0 6m14-6a3 3 0 0 1 0 6M2 20v-3a4 4 0 0 1 3-4m17 7v-3a4 4 0 0 0-3-4"/></svg>}</span>
   <span className={styles.copy}><small>{awards?'GHI NHẬN & LAN TỎA':'KẾT NỐI & ĐỒNG HÀNH'}</small><strong>{awards?'Thi đua – Khen thưởng':'Tổ chức quần chúng'}</strong></span>
   <span className={styles.arrow} aria-hidden="true">↗</span>
  </Link>
 </nav>;
}
