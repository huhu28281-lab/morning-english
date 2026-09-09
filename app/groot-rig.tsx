export default function GrootRig({playing=false,completed=false,className=""}:{playing?:boolean;completed?:boolean;className?:string}) {
  return <span role="img" aria-label="그루트" className={`groot-rig leaf-rig ${playing?"groot-playing":""} ${completed?"groot-completed":""} ${className}`}>
    {(["left-leg","right-leg","right-arm","body","left-arm","blink"] as const).map(part => <img key={part} className={`groot-part leaf-${part}`} src={`/leaf-rig-${part}.webp`} width={544} height={544} alt="" draggable={false}/>)}
  </span>;
}
