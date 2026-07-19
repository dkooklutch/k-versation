import{redirect}from'next/navigation';export default async function EpisodeRedirect({params}:{params:Promise<{slug:string}>}){const{slug}=await params;redirect(`/conversations/${slug}`)}
