export default function GrootRig({playing=false,completed=false,className=""}:{playing?:boolean;completed?:boolean;className?:string}) {
  return <span role="img" aria-label="그루트" className={`groot-rig ${playing?"groot-playing":""} ${completed?"groot-completed":""} ${className}`}>
    <img className="groot-part" src="/thursday-leaf-character.webp" width={1408} height={768} alt="" draggable={false} style={{objectFit:"cover"}}/>
  </span>;
}
