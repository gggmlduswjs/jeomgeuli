type Props = { cell: [number,number,number,number,number,number], size?: number };
export default function BrailleCell({ cell, size=54 }: Props){
  const on = (i:number)=> cell[i]===1;
  const Dot = ({on}:{on:boolean}) => (
    <span className={`inline-block rounded-full shadow ${on?'bg-blue-600':'bg-gray-200'}`}
      style={{width:size/6, height:size/6}} />
  );
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-2 p-2 rounded-xl bg-white shadow-sm border">
      <Dot on={on(0)} /><Dot on={on(3)} />
      <Dot on={on(1)} /><Dot on={on(4)} />
      <Dot on={on(2)} /><Dot on={on(5)} />
    </div>
  );
}