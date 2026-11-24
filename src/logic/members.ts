import type { Member } from '../types'

export function getMemberName(members: Member[], id: string): string {
  return members.find((member) => member.id === id)?.name ?? 'Unknown'
}
