export const mascotNames = ["병아리", "꺼먹살이", "토끼", "수달", "고양이"];
export default function WeekdayMascot({day=1,completed=false,className=""}:{day?:number;completed?:boolean;className?:string}) {
  const index=Math.max(0,Math.min(4,day-1));
  if(index===0)return <img className={className} src={completed?"/morning-chick-hooray.webp":"/morning-chick.webp"} alt={mascotNames[index]} width={120} height={120} draggable={false}/>;
  const positions=["0% 0%","100% 0%","0% 100%","100% 100%"];
  return <span role="img" aria-label={mascotNames[index]} className={`weekday-mascot ${className}`} style={{backgroundPosition:positions[index-1]}}/>;
}
