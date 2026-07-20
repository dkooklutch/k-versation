import { scryptSync } from 'crypto'
import { safeEqual } from '@/lib/security'
export function verifyHostPassword(password:string,encoded:string){const[scheme,salt,expected]=encoded.split('$');if(scheme!=='scrypt'||!salt||!expected)return false;return safeEqual(scryptSync(password,salt,32).toString('hex'),expected)}
