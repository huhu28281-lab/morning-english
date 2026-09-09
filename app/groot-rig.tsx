export default function GrootRig({playing=false,completed=false,className=""}:{playing?:boolean;completed?:boolean;className?:string}) {
  return <span role="img" aria-label="그루트" className={`groot-rig ${playing?"groot-playing":""} ${completed?"groot-completed":""} ${className}`}>
    {(["left-leg","right-leg","left-arm","right-arm","body"] as const).map(part=><img key={part} className={`groot-part groot-${part}`} src={`/groot-${part}.webp`} width={256} height={256} alt="" draggable={false}/>)}
  </span>;
}
