import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Escale — locations de vacances en direct";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{height:"100%",width:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#F8F4EC",padding:"72px",color:"#173C3A",fontFamily:"sans-serif"}}>
      <div style={{fontSize:28,letterSpacing:2}}>ESCALE</div>
      <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:900}}>
        <div style={{fontSize:64,fontWeight:700}}>Trouvez votre prochaine Escale.</div>
        <div style={{fontSize:30,color:"#6B5B4D"}}>Locations de vacances en direct, recherche intelligente et Prix Juste.</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,fontSize:24}}><span style={{background:"#C97B3D",color:"white",padding:"12px 20px",borderRadius:999}}>escale.app</span><span>France</span></div>
    </div>,
    size
  );
}
