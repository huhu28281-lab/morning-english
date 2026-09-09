export default function GrootRig({playing=false,completed=false,className=""}:{playing?:boolean;completed?:boolean;className?:string}) {
  return <span role="img" aria-label="그루트" className={`groot-rig ${playing?"groot-playing":""} ${completed?"groot-completed":""} ${className}`}>
    <img className="groot-part" src="/thursday-leaf-transparent.webp" width={544} height={544} alt="" draggable={false}/>
  </span>;
}
