import Link from "next/link";

const items=[['Cockpit','/hote/crm'],['Clients','/hote/crm/clients'],['Calendrier','/hote/crm/calendrier'],['Paiements','/hote/crm/paiements'],['Finances','/hote/crm/finances'],['Documents','/hote/crm/documents']];

export default function CrmLayout({children}){
 return <><div className="sticky top-0 z-30 border-b border-stone-200 bg-[#FFFDF8]/95 backdrop-blur"><nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">{items.map(([label,href])=><Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-[#E1EEE9] hover:text-[#1B3A3A]">{label}</Link>)}</nav></div>{children}</>;
}
