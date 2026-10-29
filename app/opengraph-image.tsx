import { ImageResponse } from 'next/og';
export const runtime='nodejs';
export const alt='The Ellison Group | Little Rock Real Estate Experts';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{background:'#f6f3ee',color:'#14171a',width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:90}}><p style={{fontSize:16,letterSpacing:6,color:'#8b1e2d'}}>ROOTED IN LITTLE ROCK. BUILT AROUND YOU.</p><div style={{fontFamily:'Georgia',fontSize:110,lineHeight:1.1,letterSpacing:-5,marginTop:30}}>The Ellison Group</div><p style={{fontSize:28,marginTop:35}}>Let’s Find Your Dream Home</p><div style={{height:3,width:130,background:'#8b1e2d',marginTop:40}}/></div>,size);}
