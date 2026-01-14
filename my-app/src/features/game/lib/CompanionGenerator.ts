import { CompanionEntity } from '../types';
export const generateCompanion = (level: number): CompanionEntity => ({ id: `comp_${crypto.randomUUID()}`, type: 'companion', name: 'Ally', x: 0, y: 0, width: 24, height: 24, color: '#00f', speed: 4, dead: false, hp: 100, maxHp: 100, mp: 50, maxMp: 50, level, defense: 5, attack: 10, job: 'Warrior', joinDate: Date.now() });
