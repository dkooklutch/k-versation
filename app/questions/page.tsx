import type {Metadata} from 'next'
import SubmissionForm from '@/components/SubmissionForm'
export const metadata:Metadata={title:'Questions',description:'Send a question, topic, guest recommendation, or note to K-VERSATION.'}
export default function Questions(){return <section className="form-page"><div><div className="eyebrow">Questions / Your turn</div><h1>WHAT<br/>SHOULD WE<br/>ASK?</h1><p>Questions shape the archive. Send a topic, guest recommendation, piece of feedback, or general inquiry. Replies come from <a href="mailto:thekversation@gmail.com">thekversation@gmail.com</a>.</p></div><SubmissionForm/></section>}
