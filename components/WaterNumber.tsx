const glyphs = [[24,214],[245,149],[423,201],[639,206],[852,225],[1082,202],[1291,215],[1506,201],[1712,218],[1936,214]];

/** The ten transparent glass glyphs compose live values, never fixed demo totals. */
export default function WaterNumber({value}:{value:number|undefined}) {
  const label=value===undefined?'—':value.toLocaleString('vi-VN');
  let cursor=0;
  const parts=Array.from(label).map((char,index)=>{
    const glyph=/[0-9]/.test(char)?glyphs[Number(char)]:null;
    const width=glyph?glyph[1]:48, x=cursor;
    cursor+=width+5;
    return glyph?<svg key={index} x={x} y="0" width={width} height="330" viewBox={`${glyph[0]} 178 ${width} 330`} overflow="hidden"><image href="/water-digits.png" width="2172" height="724"/></svg>:<circle key={index} cx={x+24} cy="293" r="17" fill="#a3eee5" stroke="#edffff" strokeWidth="4"/>;
  });
  return <strong className="waterNumber" aria-label={label}>{value===undefined?<span>—</span>:<svg aria-hidden="true" focusable="false" viewBox={`0 0 ${cursor} 330`}><title>{label}</title>{parts}</svg>}</strong>;
}
